using System.ComponentModel.DataAnnotations;
using Peerly.Api.Models;

namespace Peerly.Api.Dtos;

public record MessageDto(
    Guid Id,
    Guid SenderId,
    Guid ReceiverId,
    string Content,
    DateTime SentAt,
    MessageUserDto Sender,
    MessageUserDto Receiver)
{
    /// <remarks>Expects <see cref="Message.Sender"/> and <see cref="Message.Receiver"/> to be loaded.</remarks>
    public static MessageDto From(Message message) => new(
        message.Id,
        message.SenderId,
        message.ReceiverId,
        message.Content,
        message.SentAt,
        MessageUserDto.From(message.Sender),
        MessageUserDto.From(message.Receiver));
}

public record MessageUserDto(Guid Id, string Name, string? ProfileImageUrl)
{
    public static MessageUserDto From(User user) => new(user.Id, user.Name, user.ProfileImageUrl);
}

public record SendMessageDto([Required] Guid? ReceiverId, string Content);
