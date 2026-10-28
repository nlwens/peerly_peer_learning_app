using System.Net;
using System.Net.Http.Json;
using Peerly.Api.Dtos;
using Peerly.Api.Models;

namespace Peerly.Api.Tests;

[Collection(ApiCollection.Name)]
public class UsersTests(PeerlyApiFactory api)
{
    [Fact]
    public async Task User_list_is_public_and_hides_emails()
    {
        var user = await api.CreateUserAsync();

        var users = await api.CreateClient().GetFromJsonAsync<List<UserDto>>("/users", PeerlyApiFactory.Json);

        var listed = Assert.Single(users!, u => u.Id == user.Id);
        Assert.Null(listed.Email);
    }

    [Fact]
    public async Task Email_is_only_visible_to_its_owner()
    {
        var alice = await api.CreateUserAsync();
        var bob = await api.CreateUserAsync();

        var self = await alice.GetAsync<UserDto>($"/users/{alice.Id}");
        var other = await bob.GetAsync<UserDto>($"/users/{alice.Id}");

        Assert.NotNull(self.Email);
        Assert.Null(other.Email);
    }

    [Fact]
    public async Task Users_can_update_their_own_profile_only()
    {
        var alice = await api.CreateUserAsync();
        var bob = await api.CreateUserAsync();
        var update = new { name = "Alice", major = "ICT", education_level = "WO", strengths = new[] { "Java" } };

        var own = await (await alice.PutAsync($"/users/{alice.Id}", update)).ReadAsync<UserDto>();
        var others = await bob.PutAsync($"/users/{alice.Id}", update);

        Assert.Equal(("Alice", "ICT", EduLevel.Wo), (own.Name, own.Major, own.EducationLevel));
        Assert.Equal(["Java"], own.Strengths);
        await others.AssertErrorAsync(HttpStatusCode.Forbidden, "your own account");
    }

    [Fact]
    public async Task Paused_users_cannot_edit_their_profile_until_resumed()
    {
        var alice = await api.CreateUserAsync();

        var paused = await (await alice.Client.PatchAsJsonAsync(
            $"/users/{alice.Id}/pause", new { is_paused = true }, PeerlyApiFactory.Json)).ReadAsync<UserDto>();
        var blocked = await alice.PutAsync($"/users/{alice.Id}", new { major = "Law" });
        await alice.Client.PatchAsJsonAsync($"/users/{alice.Id}/pause", new { is_paused = false }, PeerlyApiFactory.Json);
        var allowed = await alice.PutAsync($"/users/{alice.Id}", new { major = "Law" });

        Assert.True(paused.IsPaused);
        await blocked.AssertErrorAsync(HttpStatusCode.Forbidden, "Resume your account");
        Assert.Equal(HttpStatusCode.OK, allowed.StatusCode);
    }

    [Fact]
    public async Task Deleting_an_account_removes_it()
    {
        var alice = await api.CreateUserAsync();
        var bob = await api.CreateUserAsync();
        await alice.SendRequestAsync(bob, RequestType.Request);

        var response = await alice.Client.DeleteAsync($"/users/{alice.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await bob.Client.GetAsync($"/users/{alice.Id}")).StatusCode);
        Assert.Empty(await bob.GetAsync<List<StudyRequestDto>>($"/users/{bob.Id}/requests"));
    }
}
