using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Peerly.Api.Data;
using Peerly.Api.Dtos;
using Peerly.Api.Models;
using Testcontainers.PostgreSql;

namespace Peerly.Api.Tests;

[CollectionDefinition(Name)]
public class ApiCollection : ICollectionFixture<PeerlyApiFactory>
{
    public const string Name = "api";
}

/// <summary>
/// Runs the API against a real PostgreSQL database: a throwaway container by default,
/// or the database in <c>TEST_DATABASE_CONNECTION_STRING</c> when set (used in CI).
/// </summary>
public class PeerlyApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    public static readonly JsonSerializerOptions Json = CreateJsonOptions();

    private readonly string? _externalConnectionString =
        Environment.GetEnvironmentVariable("TEST_DATABASE_CONNECTION_STRING");

    private readonly PostgreSqlContainer _database = new PostgreSqlBuilder("postgres:17-alpine").Build();

    private string ConnectionString => _externalConnectionString ?? _database.GetConnectionString();

    public async Task InitializeAsync()
    {
        if (_externalConnectionString is null)
        {
            await _database.StartAsync();
        }

        await using var scope = Services.CreateAsyncScope();
        await scope.ServiceProvider.GetRequiredService<PeerlyDbContext>().Database.MigrateAsync();
    }

    public new async Task DisposeAsync()
    {
        await base.DisposeAsync();
        await _database.DisposeAsync();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder) =>
        builder.ConfigureAppConfiguration(config => config.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:Peerly"] = ConnectionString,
            ["Jwt:Secret"] = "integration-tests-secret-that-is-long-enough",
        }));

    public async Task<TestUser> CreateUserAsync(string name = "Test User")
    {
        var email = $"{Guid.NewGuid():N}@example.com";
        var anonymous = CreateClient();

        var register = await anonymous.PostAsJsonAsync(
            "/auth/register", new { email, password = "password123", name }, Json);
        register.EnsureSuccessStatusCode();

        var login = await anonymous.PostAsJsonAsync("/auth/login", new { email, password = "password123" }, Json);
        var result = await login.ReadAsync<LoginResultDto>();

        var client = CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", result.AccessToken);
        return new TestUser(result.User.Id, result.AccessToken, client);
    }

    public async Task<User> LoadUserAsync(Guid id)
    {
        await using var scope = Services.CreateAsyncScope();
        return await scope.ServiceProvider.GetRequiredService<PeerlyDbContext>()
            .Users.AsNoTracking().SingleAsync(u => u.Id == id);
    }

    public async Task UpdateUserAsync(Guid id, Action<User> update)
    {
        await using var scope = Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<PeerlyDbContext>();
        update(await db.Users.SingleAsync(u => u.Id == id));
        await db.SaveChangesAsync();
    }

    /// <summary>Connects like the mobile app does: WebSockets only, token in the query string.</summary>
    public async Task<HubConnection> ConnectToHubAsync(TestUser user)
    {
        var connection = new HubConnectionBuilder()
            .WithUrl(new Uri(Server.BaseAddress, "/hubs/peerly"), options =>
            {
                options.Transports = HttpTransportType.WebSockets;
                options.SkipNegotiation = true;
                options.WebSocketFactory = async (context, cancellationToken) =>
                {
                    var uri = new UriBuilder(context.Uri) { Query = $"access_token={user.Token}" }.Uri;
                    return await Server.CreateWebSocketClient().ConnectAsync(uri, cancellationToken);
                };
            })
            .AddJsonProtocol(options => options.PayloadSerializerOptions = Json)
            .Build();

        await connection.StartAsync();
        return connection;
    }

    private static JsonSerializerOptions CreateJsonOptions()
    {
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web)
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        };
        options.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.SnakeCaseUpper));
        return options;
    }
}
