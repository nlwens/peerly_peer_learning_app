using Microsoft.EntityFrameworkCore;
using Peerly.Api.Data;
using Peerly.Api.Dtos;
using Peerly.Api.Exceptions;
using Peerly.Api.Models;

namespace Peerly.Api.Services;

public class AuthService(PeerlyDbContext db, TokenService tokens)
{
    public async Task<bool> IsEmailAvailableAsync(string email)
    {
        var normalized = NormalizeEmail(email);
        return !await db.Users.AnyAsync(u => u.Email == normalized);
    }

    public async Task<UserDto> RegisterAsync(RegisterDto dto)
    {
        if (!await IsEmailAvailableAsync(dto.Email))
        {
            throw ApiException.Conflict("Email already in use");
        }

        var user = new User
        {
            Name = dto.Name.Trim(),
            Email = NormalizeEmail(dto.Email),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Major = dto.Major,
            EducationLevel = dto.EducationLevel,
            Description = dto.Description,
            Strengths = dto.Strengths ?? [],
            NeedsHelpWith = dto.NeedsHelpWith ?? [],
            ProfileImageUrl = dto.ProfileImageUrl,
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        return UserDto.From(user, includeEmail: true);
    }

    public async Task<LoginResultDto> LoginAsync(LoginDto dto)
    {
        var email = NormalizeEmail(dto.Email);
        var user = await db.Users.AsNoTracking().SingleOrDefaultAsync(u => u.Email == email);

        if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            throw ApiException.Unauthorized("Invalid credentials");
        }

        return new LoginResultDto(tokens.CreateToken(user), UserDto.From(user, includeEmail: true));
    }

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
}
