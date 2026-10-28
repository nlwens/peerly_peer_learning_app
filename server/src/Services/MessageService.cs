using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Peerly.Api.Data;
using Peerly.Api.Dtos;
using Peerly.Api.Exceptions;
using Peerly.Api.Hubs;
using Peerly.Api.Models;

namespace Peerly.Api.Services;

public class MessageService(PeerlyDbContext db, IHubContext<PeerlyHub, IPeerlyClient> hub)
{
    public async Task<List<MessageDto>> GetConversationAsync(Guid userId, Guid otherUserId)
    {
        if (otherUserId == userId)
        {
            throw ApiException.BadRequest("Conversation must be with another user");
        }

        if (!await db.Users.AnyAsync(u => u.Id == otherUserId))
        {
            throw ApiException.NotFound("User not found");
        }

        var messages = await db.Messages
            .AsNoTracking()
            .Include(m => m.Sender)
            .Include(m => m.Receiver)
            .Where(m => (m.SenderId == userId && m.ReceiverId == otherUserId)
                || (m.SenderId == otherUserId && m.ReceiverId == userId))
            .OrderBy(m => m.SentAt)
            .ToListAsync();

        return messages.ConvertAll(MessageDto.From);
    }

    /// <summary>Stores the message and pushes it to both participants.</summary>
    public async Task<MessageDto> SendAsync(Guid senderId, Guid receiverId, string content)
    {
        content = content.Trim();
        if (content.Length == 0)
        {
            throw ApiException.BadRequest("Message content cannot be empty");
        }

        if (receiverId == senderId)
        {
            throw ApiException.BadRequest("Cannot send message to yourself");
        }

        var sender = await db.Users.FindAsync(senderId) ?? throw ApiException.NotFound("User not found");
        var receiver = await db.Users.FindAsync(receiverId) ?? throw ApiException.NotFound("Receiver not found");

        var message = new Message { Sender = sender, Receiver = receiver, Content = content };
        db.Messages.Add(message);
        await db.SaveChangesAsync();

        var dto = MessageDto.From(message);
        await hub.Clients.Users(senderId.ToString(), receiverId.ToString()).ReceiveMessage(dto);
        return dto;
    }
}
