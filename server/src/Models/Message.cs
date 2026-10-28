namespace Peerly.Api.Models;

public class Message
{
    public Guid Id { get; set; }
    public Guid SenderId { get; set; }
    public Guid ReceiverId { get; set; }
    public required string Content { get; set; }
    public DateTime SentAt { get; set; } = DateTime.UtcNow;

    public User Sender { get; set; } = null!;
    public User Receiver { get; set; } = null!;
}
