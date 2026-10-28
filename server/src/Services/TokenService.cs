using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Peerly.Api.Models;

namespace Peerly.Api.Services;

public class TokenService(IOptions<JwtOptions> options)
{
    private readonly JsonWebTokenHandler _handler = new();

    public string CreateToken(User user)
    {
        var jwt = options.Value;

        return _handler.CreateToken(new SecurityTokenDescriptor
        {
            Claims = new Dictionary<string, object>
            {
                [JwtRegisteredClaimNames.Sub] = user.Id.ToString(),
                [JwtRegisteredClaimNames.Email] = user.Email,
            },
            Expires = DateTime.UtcNow.AddDays(jwt.ExpiresInDays),
            SigningCredentials = new SigningCredentials(jwt.SigningKey, SecurityAlgorithms.HmacSha256),
        });
    }
}
