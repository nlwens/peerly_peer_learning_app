using System.ComponentModel.DataAnnotations;
using Peerly.Api.Models;

namespace Peerly.Api.Dtos;

public record UserRatingDto(Guid Id, Guid StudySessionId, Guid RaterId, Guid RateeId, int Stars, DateTime CreatedAt)
{
    public static UserRatingDto From(UserRating rating) => new(
        rating.Id,
        rating.StudySessionId,
        rating.RaterId,
        rating.RateeId,
        rating.Stars,
        rating.CreatedAt);
}

public record CreateRatingDto(
    [Required] Guid? StudySessionId,
    [Required] Guid? RateeId,
    [Required, Range(1, 5)] int? Stars);

public record RatingSummaryDto(Guid Id, int RatingAverage, int RatingCount);
