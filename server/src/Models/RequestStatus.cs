using NpgsqlTypes;

namespace Peerly.Api.Models;

public enum RequestStatus
{
    [PgName("PENDING")]
    Pending,

    [PgName("DECLINED")]
    Declined,

    [PgName("ACCEPTED")]
    Accepted,

    [PgName("CANCELED")]
    Canceled,

    [PgName("COMPLETED")]
    Completed,
}
