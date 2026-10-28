using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Peerly.Api.Data;
using Peerly.Api.Dtos;
using Peerly.Api.Exceptions;
using Peerly.Api.Hubs;
using Peerly.Api.Models;
using Peerly.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<PeerlyDbContext>((services, options) => options
    .UseNpgsql(
        services.GetRequiredService<IConfiguration>().GetConnectionString("Peerly"),
        npgsql => npgsql
            .MapEnum<EduLevel>("edu_level")
            .MapEnum<RequestStatus>("request_status")
            .MapEnum<RequestType>("request_type"))
    .UseSnakeCaseNamingConvention());

builder.Services.AddOptions<JwtOptions>()
    .BindConfiguration(JwtOptions.SectionName)
    .ValidateDataAnnotations()
    .ValidateOnStart();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
builder.Services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
    .Configure<IOptions<JwtOptions>>((options, jwt) =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            IssuerSigningKey = jwt.Value.SigningKey,
        };

        // WebSocket clients can't send an Authorization header, so SignalR passes the token in the query string.
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                if (context.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                {
                    context.Token = context.Request.Query["access_token"];
                }

                return Task.CompletedTask;
            },
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddControllers().AddJsonOptions(options => ConfigureJson(options.JsonSerializerOptions));
builder.Services.ConfigureHttpJsonOptions(options => ConfigureJson(options.SerializerOptions));
builder.Services.Configure<ApiBehaviorOptions>(options =>
    options.InvalidModelStateResponseFactory = context =>
    {
        var errors = context.ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
        return new BadRequestObjectResult(new ErrorDto(string.Join(" ", errors)));
    });

builder.Services.AddSignalR().AddJsonProtocol(options => ConfigureJson(options.PayloadSerializerOptions));

builder.Services.AddExceptionHandler<ApiExceptionHandler>();
builder.Services.AddProblemDetails();
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddHealthChecks().AddDbContextCheck<PeerlyDbContext>();

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
    });
    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = [],
    });
});

builder.Services.AddSingleton<TokenService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<StudyRequestService>();
builder.Services.AddScoped<StudySessionService>();
builder.Services.AddScoped<RatingService>();
builder.Services.AddScoped<MessageService>();

var app = builder.Build();

app.UseExceptionHandler();
app.UseSwagger();
app.UseSwaggerUI();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<PeerlyHub>("/hubs/peerly");
app.MapHealthChecks("/health");

app.Run();

static void ConfigureJson(JsonSerializerOptions json)
{
    json.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
    json.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.SnakeCaseUpper, allowIntegerValues: false));
}
