using Microsoft.EntityFrameworkCore;
using Peerly.Api.Data;
using Peerly.Api.Dtos;
using Peerly.Api.Exceptions;
using Peerly.Api.Models;

namespace Peerly.Api.Services;

public class RatingService(PeerlyDbContext db)
{
    /// <summary>Creates or replaces the rater's rating of the other participant in a session.</summary>
    public async Task<UserRatingDto> RateAsync(Guid raterId, CreateRatingDto dto)
    {
        var sessionId = dto.StudySessionId!.Value;
        var rateeId = dto.RateeId!.Value;
        var stars = dto.Stars!.Value;

        if (rateeId == raterId)
        {
            throw ApiException.BadRequest("You cannot rate yourself");
        }

        var session = await db.StudySessions
            .Include(s => s.Request)
            .SingleOrDefaultAsync(s => s.Id == sessionId);
        if (session is null || !session.Request.IsParticipant(raterId))
        {
            throw ApiException.NotFound("Study session not found");
        }

        var request = session.Request;
        if (request.OtherParticipant(raterId) != rateeId)
        {
            throw ApiException.BadRequest("You can only rate the other participant of this session");
        }

        var raterConfirmed = raterId == request.RequesterId ? session.RequesterCompleted : session.ReceiverCompleted;
        if (!raterConfirmed)
        {
            throw ApiException.BadRequest("You can only rate after confirming completion on your side");
        }

        var ratee = await db.Users.SingleAsync(u => u.Id == rateeId);
        var rating = await db.UserRatings.SingleOrDefaultAsync(
            r => r.StudySessionId == sessionId && r.RaterId == raterId && r.RateeId == rateeId);

        if (rating is null)
        {
            rating = new UserRating { StudySessionId = sessionId, RaterId = raterId, RateeId = rateeId, Stars = stars };
            db.UserRatings.Add(rating);
            ratee.RatingCount++;
            ratee.RatingSum += stars;
        }
        else
        {
            ratee.RatingSum += stars - rating.Stars;
            rating.Stars = stars;
        }

        ratee.RatingAverage = (int)Math.Round((double)ratee.RatingSum / ratee.RatingCount, MidpointRounding.AwayFromZero);

        await db.SaveChangesAsync();
        return UserRatingDto.From(rating);
    }

    public async Task<RatingSummaryDto> GetSummaryAsync(Guid userId) =>
        await db.Users
            .Where(u => u.Id == userId)
            .Select(u => new RatingSummaryDto(u.Id, u.RatingAverage, u.RatingCount))
            .SingleOrDefaultAsync()
        ?? throw ApiException.NotFound("User not found");
}
