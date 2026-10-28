using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Peerly.Api.Exceptions;

namespace Peerly.Api.Controllers;

[ApiController]
[Authorize]
[Produces("application/json")]
public abstract class ApiControllerBase : ControllerBase
{
    protected Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>Routes under <c>/users/{userId}</c> may only be used by that user.</summary>
    protected void EnsureCurrentUser(Guid userId)
    {
        if (userId != CurrentUserId)
        {
            throw ApiException.Forbidden("You can only perform this action for your own account");
        }
    }
}
