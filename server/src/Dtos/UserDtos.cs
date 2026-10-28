using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Peerly.Api.Models;

namespace Peerly.Api.Dtos;

public record UserDto(
    Guid Id,
    string Name,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? Email,
    string? Major,
    EduLevel? EducationLevel,
    List<string> Strengths,
    List<string> NeedsHelpWith,
    string? Description,
    string? ProfileImageUrl,
    bool IsPaused,
    int TokenBalance,
    int RatingAverage,
    int RatingCount,
    DateTime CreatedAt)
{
    /// <param name="includeEmail">Email addresses are only shown to their owner.</param>
    public static UserDto From(User user, bool includeEmail) => new(
        user.Id,
        user.Name,
        includeEmail ? user.Email : null,
        user.Major,
        user.EducationLevel,
        user.Strengths,
        user.NeedsHelpWith,
        user.Description,
        user.ProfileImageUrl,
        user.IsPaused,
        user.TokenBalance,
        user.RatingAverage,
        user.RatingCount,
        user.CreatedAt);
}

public record UpdateUserDto(
    [MaxLength(255)] string? Name,
    [MaxLength(100)] string? Major,
    EduLevel? EducationLevel,
    string? Description,
    List<string>? Strengths,
    List<string>? NeedsHelpWith,
    string? ProfileImageUrl);

public record SetPausedDto([Required] bool? IsPaused);
