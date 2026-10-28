using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Peerly.Api.Dtos;
using Peerly.Api.Exceptions;
using Peerly.Api.Services;

namespace Peerly.Api.Hubs;

[Authorize]
public class PeerlyHub(MessageService messages) : Hub<IPeerlyClient>
{
    public async Task<MessageDto> SendMessage(Guid receiverId, string content)
    {
        try
        {
            return await messages.SendAsync(Guid.Parse(Context.UserIdentifier!), receiverId, content);
        }
        catch (ApiException ex)
        {
            throw new HubException(ex.Message);
        }
    }
}
