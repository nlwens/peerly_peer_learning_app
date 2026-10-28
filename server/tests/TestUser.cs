using System.Net.Http.Json;
using Peerly.Api.Dtos;
using Peerly.Api.Models;

namespace Peerly.Api.Tests;

/// <summary>A registered user with an authenticated client, plus shortcuts for the request flow.</summary>
public record TestUser(Guid Id, string Token, HttpClient Client)
{
    public Task<HttpResponseMessage> PostAsync(string url, object body) =>
        Client.PostAsJsonAsync(url, body, PeerlyApiFactory.Json);

    public Task<HttpResponseMessage> PutAsync(string url, object body) =>
        Client.PutAsJsonAsync(url, body, PeerlyApiFactory.Json);

    public async Task<T> GetAsync<T>(string url) => await (await Client.GetAsync(url)).ReadAsync<T>();

    public Task<HttpResponseMessage> TrySendRequestAsync(TestUser receiver, RequestType type) =>
        PostAsync($"/users/{Id}/requests", new { receiver_id = receiver.Id, subject = "Calculus", type });

    public async Task<StudyRequestDto> SendRequestAsync(TestUser receiver, RequestType type) =>
        await (await TrySendRequestAsync(receiver, type)).ReadAsync<StudyRequestDto>();

    public Task<HttpResponseMessage> TrySetStatusAsync(Guid requestId, RequestStatus status) =>
        PutAsync($"/users/{Id}/requests/{requestId}", new { status });

    public async Task<StudyRequestDto> SetStatusAsync(Guid requestId, RequestStatus status) =>
        await (await TrySetStatusAsync(requestId, status)).ReadAsync<StudyRequestDto>();

    public async Task<StudyRequestDto> ConfirmCompletionAsync(Guid requestId) =>
        await (await Client.PostAsync($"/users/{Id}/requests/{requestId}/complete", null)).ReadAsync<StudyRequestDto>();
}
