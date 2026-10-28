namespace Peerly.Api.Exceptions;

/// <summary>
/// An expected failure whose message is safe to show to the client.
/// </summary>
public class ApiException(int statusCode, string message) : Exception(message)
{
    public int StatusCode { get; } = statusCode;

    public static ApiException BadRequest(string message) => new(StatusCodes.Status400BadRequest, message);

    public static ApiException Unauthorized(string message) => new(StatusCodes.Status401Unauthorized, message);

    public static ApiException Forbidden(string message) => new(StatusCodes.Status403Forbidden, message);

    public static ApiException NotFound(string message) => new(StatusCodes.Status404NotFound, message);

    public static ApiException Conflict(string message) => new(StatusCodes.Status409Conflict, message);
}
