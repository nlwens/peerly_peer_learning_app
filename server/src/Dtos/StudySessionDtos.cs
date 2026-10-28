using System.ComponentModel.DataAnnotations;
using Peerly.Api.Models;

namespace Peerly.Api.Dtos;

public record StudySessionDto(
    Guid Id,
    Guid RequestId,
    DateTime? ScheduledDatetime,
    bool RequesterCompleted,
    bool ReceiverCompleted,
    DateTime? CompletedAt,
    DateTime CreatedAt)
{
    public static StudySessionDto From(StudySession session) => new(
        session.Id,
        session.RequestId,
        session.ScheduledDatetime,
        session.RequesterCompleted,
        session.ReceiverCompleted,
        session.CompletedAt,
        session.CreatedAt);
}

public record UpdateStudySessionDto([Required] DateTime? ScheduledDatetime);
