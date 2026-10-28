using System.Net;
using Peerly.Api.Dtos;
using Peerly.Api.Models;

namespace Peerly.Api.Tests;

[Collection(ApiCollection.Name)]
public class RatingsTests(PeerlyApiFactory api)
{
    [Fact]
    public async Task Rating_requires_confirming_the_session_first()
    {
        var (alice, bob, sessionId) = await AcceptedSessionAsync();

        var response = await Rate(alice, sessionId, bob, stars: 5);

        await response.AssertErrorAsync(HttpStatusCode.BadRequest, "confirming completion");
    }

    [Fact]
    public async Task Rating_again_replaces_the_previous_rating()
    {
        var (alice, bob, sessionId) = await AcceptedSessionAsync();
        var session = await alice.GetAsync<StudySessionDto>($"/users/{alice.Id}/sessions/{sessionId}");
        await alice.ConfirmCompletionAsync(session.RequestId);

        await (await Rate(alice, sessionId, bob, stars: 5)).ReadAsync<UserRatingDto>();
        var first = await alice.GetAsync<RatingSummaryDto>($"/users/{bob.Id}/ratings/summary");
        await (await Rate(alice, sessionId, bob, stars: 2)).ReadAsync<UserRatingDto>();
        var second = await alice.GetAsync<RatingSummaryDto>($"/users/{bob.Id}/ratings/summary");

        Assert.Equal((5, 1), (first.RatingAverage, first.RatingCount));
        Assert.Equal((2, 1), (second.RatingAverage, second.RatingCount));
    }

    [Fact]
    public async Task Ratings_are_limited_to_the_other_participant_and_one_to_five_stars()
    {
        var (alice, bob, sessionId) = await AcceptedSessionAsync();
        var eve = await api.CreateUserAsync();

        var self = await Rate(alice, sessionId, alice, stars: 5);
        var outsider = await Rate(alice, sessionId, eve, stars: 5);
        var tooMany = await Rate(alice, sessionId, bob, stars: 6);

        await self.AssertErrorAsync(HttpStatusCode.BadRequest, "cannot rate yourself");
        await outsider.AssertErrorAsync(HttpStatusCode.BadRequest, "other participant");
        Assert.Equal(HttpStatusCode.BadRequest, tooMany.StatusCode);
    }

    private async Task<(TestUser Alice, TestUser Bob, Guid SessionId)> AcceptedSessionAsync()
    {
        var (alice, bob) = (await api.CreateUserAsync(), await api.CreateUserAsync());
        var request = await alice.SendRequestAsync(bob, RequestType.Request);
        var accepted = await bob.SetStatusAsync(request.Id, RequestStatus.Accepted);
        return (alice, bob, accepted.StudySessionId!.Value);
    }

    private static Task<HttpResponseMessage> Rate(TestUser rater, Guid sessionId, TestUser ratee, int stars) =>
        rater.PostAsync($"/users/{rater.Id}/ratings", new { study_session_id = sessionId, ratee_id = ratee.Id, stars });
}
