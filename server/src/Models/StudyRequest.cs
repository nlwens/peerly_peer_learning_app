namespace Peerly.Api.Models;

public class StudyRequest
{
    public Guid Id { get; set; }
    public Guid RequesterId { get; set; }
    public Guid ReceiverId { get; set; }
    public required string Subject { get; set; }
    public RequestType Type { get; set; }
    public RequestStatus Status { get; set; } = RequestStatus.Pending;
    public DateTime? ScheduledDatetime { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User Requester { get; set; } = null!;
    public User Receiver { get; set; } = null!;
    public StudySession? StudySession { get; set; }

    public bool IsParticipant(Guid userId) => userId == RequesterId || userId == ReceiverId;

    public Guid OtherParticipant(Guid userId) => userId == RequesterId ? ReceiverId : RequesterId;
}
