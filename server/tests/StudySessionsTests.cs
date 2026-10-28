using System.Net;
using Peerly.Api.Dtos;
using Peerly.Api.Models;

namespace Peerly.Api.Tests;

[Collection(ApiCollection.Name)]
public class StudySessionsTests(PeerlyApiFactory api)
{
    [Fact]
    public async Task Accepting_a_request_creates_a_session_for_both_participants()
    {
        var (alice, bob) = (await api.CreateUserAsync(), await api.CreateUserAsync());
        var request = await alice.SendRequestAsync(bob, RequestType.Request);
        await bob.SetStatusAsync(request.Id, RequestStatus.Accepted);

        var aliceSession = Assert.Single(await alice.GetAsync<List<StudySessionDto>>($"/users/{alice.Id}/sessions"));
        var bobSession = Assert.Single(await bob.GetAsync<List<StudySessionDto>>($"/users/{bob.Id}/sessions"));

        Assert.Equal(request.Id, aliceSession.RequestId);
        Assert.Equal(aliceSession.Id, bobSession.Id);
    }

    [Fact]
    public async Task Rescheduling_moves_both_the_session_and_its_request()
    {
        var (alice, bob, eve) = (await api.CreateUserAsync(), await api.CreateUserAsync(), await api.CreateUserAsync());
        var request = await alice.SendRequestAsync(bob, RequestType.Request);
        var sessionId = (await bob.SetStatusAsync(request.Id, RequestStatus.Accepted)).StudySessionId;
        var newTime = new DateTime(2030, 1, 15, 14, 30, 0, DateTimeKind.Utc);

        var session = await (await bob.PutAsync(
            $"/users/{bob.Id}/sessions/{sessionId}", new { scheduled_datetime = newTime })).ReadAsync<StudySessionDto>();
        var updatedRequest = await alice.GetAsync<StudyRequestDto>($"/users/{alice.Id}/requests/{request.Id}");
        var outsider = await eve.PutAsync($"/users/{eve.Id}/sessions/{sessionId}", new { scheduled_datetime = newTime });

        Assert.Equal(newTime, session.ScheduledDatetime);
        Assert.Equal(newTime, updatedRequest.ScheduledDatetime);
        Assert.Equal(HttpStatusCode.NotFound, outsider.StatusCode);
    }
}
