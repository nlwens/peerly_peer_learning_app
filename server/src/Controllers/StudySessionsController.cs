using Microsoft.AspNetCore.Mvc;
using Peerly.Api.Dtos;
using Peerly.Api.Services;

namespace Peerly.Api.Controllers;

[Route("users/{userId:guid}/sessions")]
public class StudySessionsController(StudySessionService sessions) : ApiControllerBase
{
    [HttpGet]
    public Task<List<StudySessionDto>> GetAll(Guid userId)
    {
        EnsureCurrentUser(userId);
        return sessions.GetForUserAsync(userId);
    }

    [HttpGet("{id:guid}")]
    public Task<StudySessionDto> Get(Guid userId, Guid id)
    {
        EnsureCurrentUser(userId);
        return sessions.GetAsync(userId, id);
    }

    [HttpPut("{id:guid}")]
    public Task<StudySessionDto> Reschedule(Guid userId, Guid id, UpdateStudySessionDto dto)
    {
        EnsureCurrentUser(userId);
        return sessions.RescheduleAsync(userId, id, dto.ScheduledDatetime!.Value);
    }
}
