using Peerly.Api.Dtos;

namespace Peerly.Api.Hubs;

/// <summary>Events the server pushes to connected clients.</summary>
public interface IPeerlyClient
{
    Task ReceiveMessage(MessageDto message);

    Task RequestCreated(StudyRequestDto request);

    Task RequestUpdated(StudyRequestDto request);

    Task RequestDeleted(Guid requestId);
}
