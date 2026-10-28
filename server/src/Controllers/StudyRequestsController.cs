using Microsoft.AspNetCore.Mvc;
using Peerly.Api.Dtos;
using Peerly.Api.Services;

namespace Peerly.Api.Controllers;

[Route("users/{userId:guid}/requests")]
public class StudyRequestsController(StudyRequestService requests) : ApiControllerBase
{
    [HttpGet]
    public Task<List<StudyRequestDto>> GetAll(Guid userId)
    {
        EnsureCurrentUser(userId);
        return requests.GetForUserAsync(userId);
    }

    [HttpGet("{id:guid}")]
    public Task<StudyRequestDto> Get(Guid userId, Guid id)
    {
        EnsureCurrentUser(userId);
        return requests.GetAsync(userId, id);
    }

    [HttpPost]
    [ProducesResponseType<StudyRequestDto>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Create(Guid userId, CreateStudyRequestDto dto)
    {
        EnsureCurrentUser(userId);
        var request = await requests.CreateAsync(userId, dto);
        return CreatedAtAction(nameof(Get), new { userId, id = request.Id }, request);
    }

    [HttpPut("{id:guid}")]
    public Task<StudyRequestDto> UpdateStatus(Guid userId, Guid id, UpdateStudyRequestStatusDto dto)
    {
        EnsureCurrentUser(userId);
        return requests.UpdateStatusAsync(userId, id, dto.Status!.Value);
    }

    [HttpPost("{id:guid}/complete")]
    public Task<StudyRequestDto> Complete(Guid userId, Guid id)
    {
        EnsureCurrentUser(userId);
        return requests.ConfirmCompletionAsync(userId, id);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(Guid userId, Guid id)
    {
        EnsureCurrentUser(userId);
        await requests.DeleteAsync(userId, id);
        return NoContent();
    }
}
