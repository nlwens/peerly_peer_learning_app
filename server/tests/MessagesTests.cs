using System.Net;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using Peerly.Api.Dtos;
using Peerly.Api.Models;

namespace Peerly.Api.Tests;

[Collection(ApiCollection.Name)]
public class MessagesTests(PeerlyApiFactory api)
{
    private static readonly TimeSpan EventTimeout = TimeSpan.FromSeconds(10);

    [Fact]
    public async Task Conversation_returns_messages_in_order_to_participants_only()
    {
        var (alice, bob, eve) = (await api.CreateUserAsync("Alice"), await api.CreateUserAsync("Bob"), await api.CreateUserAsync());
        await alice.PostAsync("/messages", new { receiver_id = bob.Id, content = "  Hi Bob  " });
        await bob.PostAsync("/messages", new { receiver_id = alice.Id, content = "Hi Alice" });

        var conversation = await bob.GetAsync<List<MessageDto>>($"/messages/conversation/{alice.Id}/{bob.Id}");
        var snooping = await eve.Client.GetAsync($"/messages/conversation/{alice.Id}/{bob.Id}");

        Assert.Equal(["Hi Bob", "Hi Alice"], conversation.Select(m => m.Content));
        Assert.Equal("Alice", conversation[0].Sender.Name);
        Assert.Equal(HttpStatusCode.Forbidden, snooping.StatusCode);
    }

    [Fact]
    public async Task Empty_messages_are_rejected()
    {
        var (alice, bob) = (await api.CreateUserAsync(), await api.CreateUserAsync());

        var response = await alice.PostAsync("/messages", new { receiver_id = bob.Id, content = "   " });

        await response.AssertErrorAsync(HttpStatusCode.BadRequest, "cannot be empty");
    }

    [Fact]
    public async Task Messages_sent_over_the_hub_reach_both_participants()
    {
        var (alice, bob) = (await api.CreateUserAsync(), await api.CreateUserAsync());
        await using var aliceHub = await api.ConnectToHubAsync(alice);
        await using var bobHub = await api.ConnectToHubAsync(bob);
        var aliceReceived = Next<MessageDto>(aliceHub, nameof(Hubs.IPeerlyClient.ReceiveMessage));
        var bobReceived = Next<MessageDto>(bobHub, nameof(Hubs.IPeerlyClient.ReceiveMessage));

        var sent = await aliceHub.InvokeAsync<MessageDto>("SendMessage", bob.Id, "Hello over SignalR");

        Assert.Equal(sent.Id, (await bobReceived.WaitAsync(EventTimeout)).Id);
        Assert.Equal(sent.Id, (await aliceReceived.WaitAsync(EventTimeout)).Id);
    }

    [Fact]
    public async Task Hub_reports_validation_errors_to_the_caller()
    {
        var alice = await api.CreateUserAsync();
        await using var hub = await api.ConnectToHubAsync(alice);

        var error = await Assert.ThrowsAsync<HubException>(() => hub.InvokeAsync<MessageDto>("SendMessage", alice.Id, "Hi me"));

        Assert.Contains("Cannot send message to yourself", error.Message);
    }

    [Fact]
    public async Task Request_changes_are_pushed_to_the_other_participant()
    {
        var (alice, bob) = (await api.CreateUserAsync("Alice"), await api.CreateUserAsync("Bob"));
        await using var bobHub = await api.ConnectToHubAsync(bob);
        var created = Next<StudyRequestDto>(bobHub, nameof(Hubs.IPeerlyClient.RequestCreated));

        var request = await alice.SendRequestAsync(bob, RequestType.Request);
        var pushed = await created.WaitAsync(EventTimeout);

        Assert.Equal(request.Id, pushed.Id);
        Assert.Equal("Alice", pushed.OtherUserName);
    }

    private static Task<T> Next<T>(HubConnection connection, string method)
    {
        var received = new TaskCompletionSource<T>(TaskCreationOptions.RunContinuationsAsynchronously);
        connection.On<T>(method, value => received.TrySetResult(value));
        return received.Task;
    }
}
