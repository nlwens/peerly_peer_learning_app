using System.ComponentModel.DataAnnotations;
using Peerly.Api.Models;

namespace Peerly.Api.Dtos;

public record RegisterDto(
    [EmailAddress, MaxLength(255)] string Email,
    [MinLength(6)] string Password,
    [MaxLength(255)] string Name,
    [MaxLength(100)] string? Major,
    EduLevel? EducationLevel,
    string? Description,
    List<string>? Strengths,
    List<string>? NeedsHelpWith,
    string? ProfileImageUrl);

public record LoginDto(string Email, string Password);

public record LoginResultDto(string AccessToken, UserDto User);

public record EmailAvailabilityDto(bool Available);
