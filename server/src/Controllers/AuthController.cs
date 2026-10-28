using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Peerly.Api.Dtos;
using Peerly.Api.Services;

namespace Peerly.Api.Controllers;

[Route("auth")]
[AllowAnonymous]
public class AuthController(AuthService auth) : ApiControllerBase
{
    [HttpGet("register/check")]
    public async Task<EmailAvailabilityDto> CheckEmail([FromQuery] string email) =>
        new(await auth.IsEmailAvailableAsync(email));

    [HttpPost("register")]
    [ProducesResponseType<UserDto>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        var user = await auth.RegisterAsync(dto);
        return Created($"/users/{user.Id}", user);
    }

    [HttpPost("login")]
    public Task<LoginResultDto> Login(LoginDto dto) => auth.LoginAsync(dto);
}
