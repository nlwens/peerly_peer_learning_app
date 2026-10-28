using System.ComponentModel.DataAnnotations;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Peerly.Api.Services;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    [Required, MinLength(32)]
    public string Secret { get; set; } = "";

    [Range(1, 365)]
    public int ExpiresInDays { get; set; } = 7;

    public SymmetricSecurityKey SigningKey => new(Encoding.UTF8.GetBytes(Secret));
}
