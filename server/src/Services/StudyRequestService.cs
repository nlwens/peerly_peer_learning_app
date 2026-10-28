using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Peerly.Api.Data;
using Peerly.Api.Dtos;
using Peerly.Api.Exceptions;
using Peerly.Api.Hubs;
using Peerly.Api.Models;

namespace Peerly.Api.Services;

/// <remarks>
/// Token rules: whoever receives help pays one token, the helper earns one when both sides confirm completion.
/// For a <see cref="RequestType.Request"/> the requester pays when sending; for an <see cref="RequestType.Offer"/>
/// the receiver pays when accepting. The payer is refunded if the request is declined or canceled.
/// </remarks>
public class StudyRequestService(PeerlyDbContext db, IHubContext<PeerlyHub, IPeerlyClient> hub)
{
    public async Task<List<StudyRequestDto>> GetForUserAsync(Guid userId)
    {
        var requests = await WithParticipants()
            .AsNoTracking()
            .Where(r => r.RequesterId == userId || r.ReceiverId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return requests.ConvertAll(r => StudyRequestDto.From(r, userId));
    }

    public async Task<StudyRequestDto> GetAsync(Guid userId, Guid requestId)
    {
        var request = await FindForParticipantAsync(userId, requestId);
        return StudyRequestDto.From(request, userId);
    }

    public async Task<StudyRequestDto> CreateAsync(Guid requesterId, CreateStudyRequestDto dto)
    {
        var receiverId = dto.ReceiverId!.Value;
        if (receiverId == requesterId)
        {
            throw ApiException.BadRequest("You cannot send a request to yourself");
        }

        var requester = await db.Users.FindAsync(requesterId) ?? throw ApiException.NotFound("User not found");
        var receiver = await db.Users.FindAsync(receiverId) ?? throw ApiException.NotFound("Receiver not found");
        if (requester.IsPaused)
        {
            throw ApiException.Forbidden("Resume your account before sending requests");
        }

        var request = new StudyRequest
        {
            Requester = requester,
            Receiver = receiver,
            Subject = dto.Subject.Trim(),
            Type = dto.Type!.Value,
            ScheduledDatetime = dto.ScheduledDatetime?.ToUniversalTime(),
        };

        if (request.Type == RequestType.Request)
        {
            SpendToken(requester);
        }

        db.Requests.Add(request);
        await db.SaveChangesAsync();

        await NotifyParticipantsAsync(request, (client, view) => client.RequestCreated(view));
        return StudyRequestDto.From(request, requesterId);
    }

    public async Task<StudyRequestDto> UpdateStatusAsync(Guid userId, Guid requestId, RequestStatus newStatus)
    {
        var request = await FindForParticipantAsync(userId, requestId);
        EnsureTransitionAllowed(request, userId, newStatus);

        switch (newStatus)
        {
            case RequestStatus.Accepted:
                if (request.Type == RequestType.Offer)
                {
                    SpendToken(request.Receiver);
                }

                request.StudySession = new StudySession { ScheduledDatetime = request.ScheduledDatetime };
                break;

            case RequestStatus.Declined:
            case RequestStatus.Canceled:
                if (HasPaid(request))
                {
                    Payer(request).TokenBalance++;
                }

                if (request.StudySession is not null)
                {
                    db.StudySessions.Remove(request.StudySession);
                    request.StudySession = null;
                }

                break;
        }

        request.Status = newStatus;
        await db.SaveChangesAsync();

        await NotifyUpdatedAsync(request);
        return StudyRequestDto.From(request, userId);
    }

    /// <summary>Records that <paramref name="userId"/> finished the session; it completes once both sides confirm.</summary>
    public async Task<StudyRequestDto> ConfirmCompletionAsync(Guid userId, Guid requestId)
    {
        var request = await FindForParticipantAsync(userId, requestId);
        if (request.Status is not (RequestStatus.Accepted or RequestStatus.Completed))
        {
            throw ApiException.BadRequest("Only accepted sessions can be completed");
        }

        var session = request.StudySession ??= new StudySession { ScheduledDatetime = request.ScheduledDatetime };
        if (userId == request.RequesterId)
        {
            session.RequesterCompleted = true;
        }
        else
        {
            session.ReceiverCompleted = true;
        }

        if (request.Status == RequestStatus.Accepted && session.RequesterCompleted && session.ReceiverCompleted)
        {
            request.Status = RequestStatus.Completed;
            session.CompletedAt = DateTime.UtcNow;
            Helper(request).TokenBalance++;
        }

        await db.SaveChangesAsync();

        await NotifyUpdatedAsync(request);
        return StudyRequestDto.From(request, userId);
    }

    public async Task DeleteAsync(Guid userId, Guid requestId)
    {
        var request = await FindForParticipantAsync(userId, requestId);
        if (request.Status is not (RequestStatus.Declined or RequestStatus.Canceled))
        {
            throw ApiException.BadRequest("Only declined or canceled requests can be deleted");
        }

        db.Requests.Remove(request);
        await db.SaveChangesAsync();

        await hub.Clients
            .Users(request.RequesterId.ToString(), request.ReceiverId.ToString())
            .RequestDeleted(request.Id);
    }

    /// <remarks>Expects the request to be loaded with its participants and study session.</remarks>
    public Task NotifyUpdatedAsync(StudyRequest request) =>
        NotifyParticipantsAsync(request, (client, view) => client.RequestUpdated(view));

    private IQueryable<StudyRequest> WithParticipants() =>
        db.Requests
            .Include(r => r.Requester)
            .Include(r => r.Receiver)
            .Include(r => r.StudySession);

    private async Task<StudyRequest> FindForParticipantAsync(Guid userId, Guid requestId)
    {
        var request = await WithParticipants().SingleOrDefaultAsync(r => r.Id == requestId);
        if (request is null || !request.IsParticipant(userId))
        {
            throw ApiException.NotFound("Request not found");
        }

        return request;
    }

    private static void EnsureTransitionAllowed(StudyRequest request, Guid userId, RequestStatus newStatus)
    {
        if (newStatus == RequestStatus.Completed)
        {
            throw ApiException.BadRequest("Use the complete endpoint to confirm a session");
        }

        var isReceiver = userId == request.ReceiverId;
        switch (request.Status, newStatus)
        {
            case (RequestStatus.Pending, RequestStatus.Accepted or RequestStatus.Declined):
                if (!isReceiver)
                {
                    throw ApiException.Forbidden("Only the receiver can accept or decline a request");
                }

                break;

            case (RequestStatus.Pending, RequestStatus.Canceled):
                if (isReceiver)
                {
                    throw ApiException.Forbidden("Only the sender can cancel a pending request; decline it instead");
                }

                break;

            case (RequestStatus.Accepted, RequestStatus.Canceled):
                break;

            default:
                throw ApiException.BadRequest(
                    $"Cannot change a {ToWireName(request.Status)} request to {ToWireName(newStatus)}");
        }
    }

    private static void SpendToken(User payer)
    {
        if (payer.IsPaused)
        {
            throw ApiException.Forbidden("Resume your account before using tokens");
        }

        if (payer.TokenBalance <= 0)
        {
            throw ApiException.BadRequest("You're out of tokens!");
        }

        payer.TokenBalance--;
    }

    private static User Payer(StudyRequest request) =>
        request.Type == RequestType.Request ? request.Requester : request.Receiver;

    private static User Helper(StudyRequest request) =>
        request.Type == RequestType.Request ? request.Receiver : request.Requester;

    private static bool HasPaid(StudyRequest request) =>
        request.Type == RequestType.Request || request.Status == RequestStatus.Accepted;

    private static string ToWireName(RequestStatus status) => status.ToString().ToUpperInvariant();

    /// <summary>Each participant gets their own view, since "other user" differs between them.</summary>
    private async Task NotifyParticipantsAsync(StudyRequest request, Func<IPeerlyClient, StudyRequestDto, Task> send)
    {
        foreach (var participantId in new[] { request.RequesterId, request.ReceiverId })
        {
            await send(hub.Clients.User(participantId.ToString()), StudyRequestDto.From(request, participantId));
        }
    }
}
