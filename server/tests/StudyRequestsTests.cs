using System.Net;
using Peerly.Api.Dtos;
using Peerly.Api.Models;

namespace Peerly.Api.Tests;

[Collection(ApiCollection.Name)]
public class StudyRequestsTests(PeerlyApiFactory api)
{
    private const int Start = User.StartingTokenBalance;

    [Fact]
    public async Task Request_costs_the_requester_a_token_and_pays_the_helper_on_completion()
    {
        var (alice, bob) = (await api.CreateUserAsync("Alice"), await api.CreateUserAsync("Bob"));

        var request = await alice.SendRequestAsync(bob, RequestType.Request);
        Assert.Equal(Start - 1, (await api.LoadUserAsync(alice.Id)).TokenBalance);

        await bob.SetStatusAsync(request.Id, RequestStatus.Accepted);
        var halfDone = await alice.ConfirmCompletionAsync(request.Id);
        var done = await bob.ConfirmCompletionAsync(request.Id);

        Assert.Equal(RequestStatus.Accepted, halfDone.Status);
        Assert.True(halfDone.RequesterCompleted);
        Assert.False(halfDone.ReceiverCompleted);
        Assert.Equal(RequestStatus.Completed, done.Status);
        Assert.NotNull(done.SessionCompletedAt);
        Assert.Equal(Start - 1, (await api.LoadUserAsync(alice.Id)).TokenBalance);
        Assert.Equal(Start + 1, (await api.LoadUserAsync(bob.Id)).TokenBalance);
    }

    [Fact]
    public async Task Offer_costs_the_receiver_a_token_on_accept_and_pays_the_offerer()
    {
        var (alice, bob) = (await api.CreateUserAsync(), await api.CreateUserAsync());

        var offer = await alice.SendRequestAsync(bob, RequestType.Offer);
        Assert.Equal(Start, (await api.LoadUserAsync(alice.Id)).TokenBalance);

        await bob.SetStatusAsync(offer.Id, RequestStatus.Accepted);
        Assert.Equal(Start - 1, (await api.LoadUserAsync(bob.Id)).TokenBalance);

        await alice.ConfirmCompletionAsync(offer.Id);
        await bob.ConfirmCompletionAsync(offer.Id);

        Assert.Equal(Start + 1, (await api.LoadUserAsync(alice.Id)).TokenBalance);
        Assert.Equal(Start - 1, (await api.LoadUserAsync(bob.Id)).TokenBalance);
    }

    [Theory]
    [InlineData(RequestStatus.Declined)]
    [InlineData(RequestStatus.Canceled)]
    public async Task Declined_or_canceled_requests_refund_the_requester(RequestStatus status)
    {
        var (alice, bob) = (await api.CreateUserAsync(), await api.CreateUserAsync());
        var request = await alice.SendRequestAsync(bob, RequestType.Request);

        var actor = status == RequestStatus.Declined ? bob : alice;
        await actor.SetStatusAsync(request.Id, status);

        Assert.Equal(Start, (await api.LoadUserAsync(alice.Id)).TokenBalance);
    }

    [Fact]
    public async Task Canceling_an_accepted_offer_refunds_the_receiver_and_removes_the_session()
    {
        var (alice, bob) = (await api.CreateUserAsync(), await api.CreateUserAsync());
        var offer = await alice.SendRequestAsync(bob, RequestType.Offer);
        var accepted = await bob.SetStatusAsync(offer.Id, RequestStatus.Accepted);

        var canceled = await alice.SetStatusAsync(offer.Id, RequestStatus.Canceled);

        Assert.NotNull(accepted.StudySessionId);
        Assert.Null(canceled.StudySessionId);
        Assert.Equal(Start, (await api.LoadUserAsync(bob.Id)).TokenBalance);
    }

    [Fact]
    public async Task Requests_cannot_be_reopened_to_collect_another_refund()
    {
        var (alice, bob) = (await api.CreateUserAsync(), await api.CreateUserAsync());
        var request = await alice.SendRequestAsync(bob, RequestType.Request);
        await bob.SetStatusAsync(request.Id, RequestStatus.Declined);

        var reopen = await bob.TrySetStatusAsync(request.Id, RequestStatus.Accepted);

        await reopen.AssertErrorAsync(HttpStatusCode.BadRequest, "Cannot change a DECLINED request to ACCEPTED");
        Assert.Equal(Start, (await api.LoadUserAsync(alice.Id)).TokenBalance);
    }

    [Fact]
    public async Task Out_of_tokens_requester_cannot_send_a_request()
    {
        var (alice, bob) = (await api.CreateUserAsync(), await api.CreateUserAsync());
        await api.UpdateUserAsync(alice.Id, u => u.TokenBalance = 0);

        var response = await alice.TrySendRequestAsync(bob, RequestType.Request);

        await response.AssertErrorAsync(HttpStatusCode.BadRequest, "You're out of tokens!");
        Assert.Empty(await alice.GetAsync<List<StudyRequestDto>>($"/users/{alice.Id}/requests"));
    }

    [Fact]
    public async Task Parallel_requests_cannot_spend_the_same_token_twice()
    {
        var (alice, bob, carol) = (await api.CreateUserAsync(), await api.CreateUserAsync(), await api.CreateUserAsync());
        await api.UpdateUserAsync(alice.Id, u => u.TokenBalance = 1);

        var responses = await Task.WhenAll(
            alice.TrySendRequestAsync(bob, RequestType.Request),
            alice.TrySendRequestAsync(carol, RequestType.Request));

        Assert.Single(responses, r => r.IsSuccessStatusCode);
        Assert.Single(await alice.GetAsync<List<StudyRequestDto>>($"/users/{alice.Id}/requests"));
        Assert.Equal(0, (await api.LoadUserAsync(alice.Id)).TokenBalance);
    }

    [Fact]
    public async Task Paused_users_cannot_send_requests()
    {
        var (alice, bob) = (await api.CreateUserAsync(), await api.CreateUserAsync());
        await api.UpdateUserAsync(alice.Id, u => u.IsPaused = true);

        var response = await alice.TrySendRequestAsync(bob, RequestType.Offer);

        await response.AssertErrorAsync(HttpStatusCode.Forbidden, "Resume your account");
    }

    [Fact]
    public async Task Only_the_receiver_can_accept_and_only_the_sender_can_cancel_while_pending()
    {
        var (alice, bob) = (await api.CreateUserAsync(), await api.CreateUserAsync());
        var request = await alice.SendRequestAsync(bob, RequestType.Request);

        var selfAccept = await alice.TrySetStatusAsync(request.Id, RequestStatus.Accepted);
        var receiverCancel = await bob.TrySetStatusAsync(request.Id, RequestStatus.Canceled);
        var markCompleted = await bob.TrySetStatusAsync(request.Id, RequestStatus.Completed);

        Assert.Equal(HttpStatusCode.Forbidden, selfAccept.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, receiverCancel.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, markCompleted.StatusCode);
    }

    [Fact]
    public async Task Requests_are_private_to_their_participants()
    {
        var (alice, bob, eve) = (await api.CreateUserAsync(), await api.CreateUserAsync(), await api.CreateUserAsync());
        var request = await alice.SendRequestAsync(bob, RequestType.Request);

        var foreignRoute = await eve.Client.GetAsync($"/users/{alice.Id}/requests");
        var notParticipant = await eve.Client.GetAsync($"/users/{eve.Id}/requests/{request.Id}");

        Assert.Equal(HttpStatusCode.Forbidden, foreignRoute.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, notParticipant.StatusCode);
    }

    [Fact]
    public async Task Each_participant_sees_the_other_user()
    {
        var (alice, bob) = (await api.CreateUserAsync("Alice"), await api.CreateUserAsync("Bob"));
        var request = await alice.SendRequestAsync(bob, RequestType.Request);

        var aliceView = await alice.GetAsync<StudyRequestDto>($"/users/{alice.Id}/requests/{request.Id}");
        var bobView = Assert.Single(await bob.GetAsync<List<StudyRequestDto>>($"/users/{bob.Id}/requests"));

        Assert.Equal("Bob", aliceView.OtherUserName);
        Assert.Equal("Alice", bobView.OtherUserName);
    }

    [Fact]
    public async Task Only_declined_or_canceled_requests_can_be_deleted()
    {
        var (alice, bob) = (await api.CreateUserAsync(), await api.CreateUserAsync());
        var request = await alice.SendRequestAsync(bob, RequestType.Request);

        var whilePending = await alice.Client.DeleteAsync($"/users/{alice.Id}/requests/{request.Id}");
        await alice.SetStatusAsync(request.Id, RequestStatus.Canceled);
        var afterCancel = await alice.Client.DeleteAsync($"/users/{alice.Id}/requests/{request.Id}");

        Assert.Equal(HttpStatusCode.BadRequest, whilePending.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, afterCancel.StatusCode);
    }
}
