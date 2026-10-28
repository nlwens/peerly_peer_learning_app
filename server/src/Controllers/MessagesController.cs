using Microsoft.AspNetCore.Mvc;
using Peerly.Api.Dtos;
using Peerly.Api.Exceptions;
using Peerly.Api.Services;

namespace Peerly.Api.Controllers;

[Route("messages")]
public class MessagesController(MessageService messages) : ApiControllerBase
{
    [HttpGet("conversation/{userAId:guid}/{userBId:guid}")]
    public Task<List<MessageDto>> GetConversation(Guid userAId, Guid userBId)
    {
        var otherUserId = CurrentUserId == userAId ? userBId
            : CurrentUserId == userBId ? userAId
            : throw ApiException.Forbidden("You can only read your own conversations");

        return messages.GetConversationAsync(CurrentUserId, otherUserId);
    }

    [HttpPost]
    [ProducesResponseType<MessageDto>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Send(SendMessageDto dto)
    {
        var message = await messages.SendAsync(CurrentUserId, dto.ReceiverId!.Value, dto.Content);
        return StatusCode(StatusCodes.Status201Created, message);
    }
}
