using System.Collections.Concurrent;
using System.Security.Cryptography;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();
app.UseCors();

// Active session tokens -> expiry time (UTC). In-memory, resets on restart.
var sessions = new ConcurrentDictionary<string, DateTime>();
var sessionLifetime = TimeSpan.FromHours(8);

var inventory = new[]
{
    "Inventory 1",
    "Inventory 2",
    "Inventory 3",
    "Inventory 4",
    "Inventory 5",
    "Inventory 6",
};

bool IsAuthorized(HttpRequest request)
{
    var header = request.Headers.Authorization.ToString();
    if (!header.StartsWith("Bearer ", StringComparison.Ordinal))
        return false;

    var token = header["Bearer ".Length..];
    if (!sessions.TryGetValue(token, out var expiresAt))
        return false;

    if (expiresAt < DateTime.UtcNow)
    {
        sessions.TryRemove(token, out _);
        return false;
    }

    return true;
}

app.MapGet("/", () => "Cody's Control Center API");

app.MapPost("/api/login", (LoginRequest login, IConfiguration config) =>
{
    var expectedUser = config["Auth:Username"] ?? "";
    var expectedPassword = config["Auth:Password"] ?? "";

    if (login.Username != expectedUser || login.Password != expectedPassword)
        return Results.Unauthorized();

    var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
    sessions[token] = DateTime.UtcNow.Add(sessionLifetime);
    return Results.Ok(new { token });
});

app.MapPost("/api/logout", (HttpRequest request) =>
{
    var header = request.Headers.Authorization.ToString();
    if (header.StartsWith("Bearer ", StringComparison.Ordinal))
        sessions.TryRemove(header["Bearer ".Length..], out _);
    return Results.Ok();
});

app.MapGet("/api/inventory", (HttpRequest request) =>
    IsAuthorized(request) ? Results.Ok(inventory) : Results.Unauthorized());

app.Run();

record LoginRequest(string Username, string Password);
