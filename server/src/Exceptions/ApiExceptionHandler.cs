using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Peerly.Api.Dtos;

namespace Peerly.Api.Exceptions;

/// <summary>Turns expected failures into <see cref="ErrorDto"/> responses; anything else falls through to a 500.</summary>
public class ApiExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken cancellationToken)
    {
        (int StatusCode, string Message)? error = exception switch
        {
            ApiException api => (api.StatusCode, api.Message),
            DbUpdateConcurrencyException =>
                (StatusCodes.Status409Conflict, "The data changed while your request was processed. Please try again."),
            DbUpdateException { InnerException: PostgresException { SqlState: PostgresErrorCodes.UniqueViolation } } =>
                (StatusCodes.Status409Conflict, "This record already exists."),
            _ => null,
        };

        if (error is null)
        {
            return false;
        }

        context.Response.StatusCode = error.Value.StatusCode;
        await context.Response.WriteAsJsonAsync(new ErrorDto(error.Value.Message), cancellationToken);
        return true;
    }
}
