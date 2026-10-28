using System.Net;
using System.Net.Http.Json;
using Peerly.Api.Dtos;
using Peerly.Api.Models;

namespace Peerly.Api.Tests;

[Collection(ApiCollection.Name)]
public class AuthTests(PeerlyApiFactory api)
{
    private readonly HttpClient _client = api.CreateClient();

    [Fact]
    public async Task Register_creates_user_with_starting_tokens_and_normalized_email()
    {
        var email = $"New.User.{Guid.NewGuid():N}@Example.com";

        var response = await _client.PostAsJsonAsync("/auth/register", new
        {
            email,
            password = "password123",
            name = "New User",
            education_level = "Master HBO",
            strengths = new[] { "Math" },
        }, PeerlyApiFactory.Json);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var user = await response.ReadAsync<UserDto>();
        Assert.Equal(email.ToLowerInvariant(), user.Email);
        Assert.Equal(EduLevel.MasterHbo, user.EducationLevel);
        Assert.Equal(["Math"], user.Strengths);
        Assert.Equal(User.StartingTokenBalance, user.TokenBalance);
    }

    [Fact]
    public async Task Register_with_taken_email_returns_conflict()
    {
        var email = $"{Guid.NewGuid():N}@example.com";
        var body = new { email, password = "password123", name = "First" };
        await _client.PostAsJsonAsync("/auth/register", body, PeerlyApiFactory.Json);

        var response = await _client.PostAsJsonAsync("/auth/register", body, PeerlyApiFactory.Json);

        await response.AssertErrorAsync(HttpStatusCode.Conflict, "Email already in use");
    }

    [Fact]
    public async Task Register_rejects_invalid_input_with_a_readable_message()
    {
        var response = await _client.PostAsJsonAsync(
            "/auth/register", new { email = "not-an-email", password = "123" }, PeerlyApiFactory.Json);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var error = await response.Content.ReadFromJsonAsync<ErrorDto>(PeerlyApiFactory.Json);
        Assert.Contains("The Name field is required.", error!.Message);
        Assert.Contains("minimum length of '6'", error.Message);
    }

    [Fact]
    public async Task Email_check_reports_availability()
    {
        var email = $"{Guid.NewGuid():N}@example.com";
        var before = await _client.GetFromJsonAsync<EmailAvailabilityDto>(
            $"/auth/register/check?email={email}", PeerlyApiFactory.Json);

        await _client.PostAsJsonAsync("/auth/register", new { email, password = "password123", name = "Taken" }, PeerlyApiFactory.Json);
        var after = await _client.GetFromJsonAsync<EmailAvailabilityDto>(
            $"/auth/register/check?email={email.ToUpperInvariant()}", PeerlyApiFactory.Json);

        Assert.True(before!.Available);
        Assert.False(after!.Available);
    }

    [Fact]
    public async Task Login_with_wrong_password_is_rejected()
    {
        var email = $"{Guid.NewGuid():N}@example.com";
        await _client.PostAsJsonAsync("/auth/register", new { email, password = "password123", name = "User" }, PeerlyApiFactory.Json);

        var response = await _client.PostAsJsonAsync("/auth/login", new { email, password = "wrong-password" }, PeerlyApiFactory.Json);

        await response.AssertErrorAsync(HttpStatusCode.Unauthorized, "Invalid credentials");
    }

    [Fact]
    public async Task Protected_endpoints_require_a_token()
    {
        var response = await _client.GetAsync($"/users/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
