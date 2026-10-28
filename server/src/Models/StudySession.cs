namespace Peerly.Api.Models;

public class StudySession
{
    public Guid Id { get; set; }
    public Guid RequestId { get; set; }
    public DateTime? ScheduledDatetime { get; set; }
    public bool RequesterCompleted { get; set; }
    public bool ReceiverCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public StudyRequest Request { get; set; } = null!;
}
