using Microsoft.EntityFrameworkCore;
using Peerly.Api.Data;
using Peerly.Api.Dtos;
using Peerly.Api.Exceptions;
using Peerly.Api.Models;

namespace Peerly.Api.Services;

public class UserService(PeerlyDbContext db)
{
    public async Task<List<UserDto>> GetAllAsync()
    {
        var users = await db.Users.AsNoTracking().OrderBy(u => u.CreatedAt).ToListAsync();
        return users.ConvertAll(u => UserDto.From(u, includeEmail: false));
    }

    public async Task<UserDto> GetAsync(Guid id, Guid viewerId)
    {
        var user = await db.Users.AsNoTracking().SingleOrDefaultAsync(u => u.Id == id)
            ?? throw ApiException.NotFound("User not found");

        return UserDto.From(user, includeEmail: id == viewerId);
    }

    public async Task<UserDto> UpdateAsync(Guid id, UpdateUserDto dto)
    {
        var user = await FindAsync(id);
        if (user.IsPaused)
        {
            throw ApiException.Forbidden("Resume your account before editing your profile");
        }

        if (dto.Name is not null) user.Name = dto.Name.Trim();
        if (dto.Major is not null) user.Major = dto.Major;
        if (dto.EducationLevel is not null) user.EducationLevel = dto.EducationLevel;
        if (dto.Description is not null) user.Description = dto.Description;
        if (dto.Strengths is not null) user.Strengths = dto.Strengths;
        if (dto.NeedsHelpWith is not null) user.NeedsHelpWith = dto.NeedsHelpWith;
        if (dto.ProfileImageUrl is not null) user.ProfileImageUrl = dto.ProfileImageUrl;

        await db.SaveChangesAsync();
        return UserDto.From(user, includeEmail: true);
    }

    public async Task<UserDto> SetPausedAsync(Guid id, bool isPaused)
    {
        var user = await FindAsync(id);
        user.IsPaused = isPaused;

        await db.SaveChangesAsync();
        return UserDto.From(user, includeEmail: true);
    }

    public async Task DeleteAsync(Guid id)
    {
        db.Users.Remove(await FindAsync(id));
        await db.SaveChangesAsync();
    }

    private async Task<User> FindAsync(Guid id) =>
        await db.Users.FindAsync(id) ?? throw ApiException.NotFound("User not found");
}
