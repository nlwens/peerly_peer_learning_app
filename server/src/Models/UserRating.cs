namespace Peerly.Api.Models;

public class UserRating
{
    public Guid Id { get; set; }
    public Guid StudySessionId { get; set; }
    public Guid RaterId { get; set; }
    public Guid RateeId { get; set; }
    public int Stars { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public StudySession StudySession { get; set; } = null!;
    public User Rater { get; set; } = null!;
    public User Ratee { get; set; } = null!;
}
