using System.Net;

namespace Peerly.Api.Tests;

[Collection(ApiCollection.Name)]
public class InfrastructureTests(PeerlyApiFactory api)
{
    private readonly HttpClient _client = api.CreateClient();

    [Fact]
    public async Task Health_check_reports_healthy_when_the_database_is_reachable()
    {
        var response = await _client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Healthy", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Swagger_document_uses_the_snake_case_contract()
    {
        var document = await _client.GetStringAsync("/swagger/v1/swagger.json");

        Assert.Contains("\"/users/{userId}/requests\"", document);
        Assert.Contains("\"access_token\"", document);
    }
}
