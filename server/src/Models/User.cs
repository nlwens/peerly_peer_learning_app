namespace Peerly.Api.Models;

public class User
{
    public const int StartingTokenBalance = 3;

    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public string? Major { get; set; }
    public EduLevel? EducationLevel { get; set; }
    public List<string> Strengths { get; set; } = [];
    public List<string> NeedsHelpWith { get; set; } = [];
    public string? Description { get; set; }
    public string? ProfileImageUrl { get; set; }
    public bool IsPaused { get; set; }
    public int TokenBalance { get; set; } = StartingTokenBalance;
    public int RatingSum { get; set; }
    public int RatingCount { get; set; }
    public int RatingAverage { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Concurrency token (PostgreSQL xmin) so parallel token or rating updates can't overwrite each other.</summary>
    public uint Version { get; set; }
}
