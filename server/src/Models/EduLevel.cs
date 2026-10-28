using System.Text.Json.Serialization;
using NpgsqlTypes;

namespace Peerly.Api.Models;

public enum EduLevel
{
    [PgName("MBO")]
    Mbo,

    [PgName("HBO")]
    Hbo,

    [PgName("WO")]
    Wo,

    [PgName("Master HBO")]
    [JsonStringEnumMemberName("Master HBO")]
    MasterHbo,

    [PgName("Master WO")]
    [JsonStringEnumMemberName("Master WO")]
    MasterWo,
}
