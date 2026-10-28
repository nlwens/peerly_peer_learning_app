using Microsoft.AspNetCore.Mvc;
using Peerly.Api.Dtos;
using Peerly.Api.Services;

namespace Peerly.Api.Controllers;

[Route("users/{userId:guid}/ratings")]
public class RatingsController(RatingService ratings) : ApiControllerBase
{
    /// <summary>Rates the other participant of a session on behalf of <paramref name="userId"/>.</summary>
    [HttpPost]
    public Task<UserRatingDto> Rate(Guid userId, CreateRatingDto dto)
    {
        EnsureCurrentUser(userId);
        return ratings.RateAsync(userId, dto);
    }

    [HttpGet("summary")]
    public Task<RatingSummaryDto> GetSummary(Guid userId) => ratings.GetSummaryAsync(userId);
}
