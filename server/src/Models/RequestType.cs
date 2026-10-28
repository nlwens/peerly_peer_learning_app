using NpgsqlTypes;

namespace Peerly.Api.Models;

public enum RequestType
{
    /// <summary>The requester asks the receiver for help and pays one token up front.</summary>
    [PgName("REQUEST")]
    Request,

    /// <summary>The requester offers help; the receiver pays one token when accepting.</summary>
    [PgName("OFFER")]
    Offer,
}
