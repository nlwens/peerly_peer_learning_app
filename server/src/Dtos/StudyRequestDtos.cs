using System.ComponentModel.DataAnnotations;
using Peerly.Api.Models;

namespace Peerly.Api.Dtos;

/// <summary>A study request as seen by one of its participants.</summary>
public record StudyRequestDto(
    Guid Id,
    Guid RequesterId,
    Guid ReceiverId,
    string Subject,
    RequestType Type,
    RequestStatus Status,
    DateTime? ScheduledDatetime,
    DateTime CreatedAt,
    Guid? StudySessionId,
    bool RequesterCompleted,
    bool ReceiverCompleted,
    DateTime? SessionCompletedAt,
    string OtherUserName,
    string? OtherUserAvatar)
{
    /// <remarks>Expects <see cref="StudyRequest.Requester"/>, <see cref="StudyRequest.Receiver"/> and <see cref="StudyRequest.StudySession"/> to be loaded.</remarks>
    public static StudyRequestDto From(StudyRequest request, Guid viewerId)
    {
        var otherUser = viewerId == request.RequesterId ? request.Receiver : request.Requester;
        var session = request.StudySession;

        return new StudyRequestDto(
            request.Id,
            request.RequesterId,
            request.ReceiverId,
            request.Subject,
            request.Type,
            request.Status,
            request.ScheduledDatetime,
            request.CreatedAt,
            session?.Id,
            session?.RequesterCompleted ?? false,
            session?.ReceiverCompleted ?? false,
            session?.CompletedAt,
            otherUser.Name,
            otherUser.ProfileImageUrl);
    }
}

public record CreateStudyRequestDto(
    [Required] Guid? ReceiverId,
    [MaxLength(255)] string Subject,
    [Required] RequestType? Type,
    DateTime? ScheduledDatetime);

public record UpdateStudyRequestStatusDto([Required] RequestStatus? Status);
