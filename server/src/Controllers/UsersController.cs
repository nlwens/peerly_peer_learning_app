using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Peerly.Api.Dtos;
using Peerly.Api.Services;

namespace Peerly.Api.Controllers;

[Route("users")]
public class UsersController(UserService users) : ApiControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public Task<List<UserDto>> GetAll() => users.GetAllAsync();

    [HttpGet("{id:guid}")]
    public Task<UserDto> Get(Guid id) => users.GetAsync(id, CurrentUserId);

    [HttpPut("{id:guid}")]
    public Task<UserDto> Update(Guid id, UpdateUserDto dto)
    {
        EnsureCurrentUser(id);
        return users.UpdateAsync(id, dto);
    }

    [HttpPatch("{id:guid}/pause")]
    public Task<UserDto> SetPaused(Guid id, SetPausedDto dto)
    {
        EnsureCurrentUser(id);
        return users.SetPausedAsync(id, dto.IsPaused!.Value);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(Guid id)
    {
        EnsureCurrentUser(id);
        await users.DeleteAsync(id);
        return NoContent();
    }
}
