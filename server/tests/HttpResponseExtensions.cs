using System.Net;
using System.Net.Http.Json;
using Peerly.Api.Dtos;

namespace Peerly.Api.Tests;

public static class HttpResponseExtensions
{
    /// <summary>Asserts success and deserializes the body, showing the error body when it fails.</summary>
    public static async Task<T> ReadAsync<T>(this HttpResponseMessage response)
    {
        if (!response.IsSuccessStatusCode)
        {
            Assert.Fail($"{(int)response.StatusCode}: {await response.Content.ReadAsStringAsync()}");
        }

        return (await response.Content.ReadFromJsonAsync<T>(PeerlyApiFactory.Json))!;
    }

    public static async Task AssertErrorAsync(this HttpResponseMessage response, HttpStatusCode status, string message)
    {
        Assert.Equal(status, response.StatusCode);
        var error = await response.Content.ReadFromJsonAsync<ErrorDto>(PeerlyApiFactory.Json);
        Assert.Contains(message, error!.Message);
    }
}
