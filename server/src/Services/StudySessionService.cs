using Microsoft.EntityFrameworkCore;
using Peerly.Api.Data;
using Peerly.Api.Dtos;
using Peerly.Api.Exceptions;
using Peerly.Api.Models;

namespace Peerly.Api.Services;

public class StudySessionService(PeerlyDbContext db, StudyRequestService requests)
{
    public async Task<List<StudySessionDto>> GetForUserAsync(Guid userId)
    {
        var sessions = await db.StudySessions
            .AsNoTracking()
            .Where(s => s.Request.RequesterId == userId || s.Request.ReceiverId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        return sessions.ConvertAll(StudySessionDto.From);
    }

    public async Task<StudySessionDto> GetAsync(Guid userId, Guid sessionId) =>
        StudySessionDto.From(await FindForParticipantAsync(userId, sessionId));

    /// <summary>Moves the session and its request to a new time.</summary>
    public async Task<StudySessionDto> RescheduleAsync(Guid userId, Guid sessionId, DateTime scheduledDatetime)
    {
        var session = await FindForParticipantAsync(userId, sessionId);
        var utc = scheduledDatetime.ToUniversalTime();
        session.ScheduledDatetime = utc;
        session.Request.ScheduledDatetime = utc;

        await db.SaveChangesAsync();

        await requests.NotifyUpdatedAsync(session.Request);
        return StudySessionDto.From(session);
    }

    private async Task<StudySession> FindForParticipantAsync(Guid userId, Guid sessionId)
    {
        var session = await db.StudySessions
            .Include(s => s.Request).ThenInclude(r => r.Requester)
            .Include(s => s.Request).ThenInclude(r => r.Receiver)
            .SingleOrDefaultAsync(s => s.Id == sessionId);

        if (session is null || !session.Request.IsParticipant(userId))
        {
            throw ApiException.NotFound("Study session not found");
        }

        return session;
    }
}
