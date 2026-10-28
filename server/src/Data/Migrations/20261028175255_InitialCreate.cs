using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Peerly.Api.Models;

#nullable disable

namespace Peerly.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:edu_level", "HBO,MBO,Master HBO,Master WO,WO")
                .Annotation("Npgsql:Enum:request_status", "ACCEPTED,CANCELED,COMPLETED,DECLINED,PENDING")
                .Annotation("Npgsql:Enum:request_type", "OFFER,REQUEST");

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    password_hash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    major = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    education_level = table.Column<EduLevel>(type: "edu_level", nullable: true),
                    strengths = table.Column<List<string>>(type: "text[]", nullable: false),
                    needs_help_with = table.Column<List<string>>(type: "text[]", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    profile_image_url = table.Column<string>(type: "text", nullable: true),
                    is_paused = table.Column<bool>(type: "boolean", nullable: false),
                    token_balance = table.Column<int>(type: "integer", nullable: false),
                    rating_sum = table.Column<int>(type: "integer", nullable: false),
                    rating_count = table.Column<int>(type: "integer", nullable: false),
                    rating_average = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "messages",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    sender_id = table.Column<Guid>(type: "uuid", nullable: false),
                    receiver_id = table.Column<Guid>(type: "uuid", nullable: false),
                    content = table.Column<string>(type: "text", nullable: false),
                    sent_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_messages", x => x.id);
                    table.ForeignKey(
                        name: "fk_messages_users_receiver_id",
                        column: x => x.receiver_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_messages_users_sender_id",
                        column: x => x.sender_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "requests",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    requester_id = table.Column<Guid>(type: "uuid", nullable: false),
                    receiver_id = table.Column<Guid>(type: "uuid", nullable: false),
                    subject = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    type = table.Column<RequestType>(type: "request_type", nullable: false),
                    status = table.Column<RequestStatus>(type: "request_status", nullable: false),
                    scheduled_datetime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_requests", x => x.id);
                    table.ForeignKey(
                        name: "fk_requests_users_receiver_id",
                        column: x => x.receiver_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_requests_users_requester_id",
                        column: x => x.requester_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "study_sessions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    request_id = table.Column<Guid>(type: "uuid", nullable: false),
                    scheduled_datetime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    requester_completed = table.Column<bool>(type: "boolean", nullable: false),
                    receiver_completed = table.Column<bool>(type: "boolean", nullable: false),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_study_sessions", x => x.id);
                    table.ForeignKey(
                        name: "fk_study_sessions_requests_request_id",
                        column: x => x.request_id,
                        principalTable: "requests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_ratings",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    study_session_id = table.Column<Guid>(type: "uuid", nullable: false),
                    rater_id = table.Column<Guid>(type: "uuid", nullable: false),
                    ratee_id = table.Column<Guid>(type: "uuid", nullable: false),
                    stars = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_ratings", x => x.id);
                    table.CheckConstraint("ck_user_ratings_not_self", "rater_id <> ratee_id");
                    table.CheckConstraint("ck_user_ratings_stars", "stars BETWEEN 1 AND 5");
                    table.ForeignKey(
                        name: "fk_user_ratings_study_sessions_study_session_id",
                        column: x => x.study_session_id,
                        principalTable: "study_sessions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_user_ratings_users_ratee_id",
                        column: x => x.ratee_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_user_ratings_users_rater_id",
                        column: x => x.rater_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_messages_receiver_id",
                table: "messages",
                column: "receiver_id");

            migrationBuilder.CreateIndex(
                name: "ix_messages_sender_id",
                table: "messages",
                column: "sender_id");

            migrationBuilder.CreateIndex(
                name: "ix_requests_receiver_id",
                table: "requests",
                column: "receiver_id");

            migrationBuilder.CreateIndex(
                name: "ix_requests_requester_id",
                table: "requests",
                column: "requester_id");

            migrationBuilder.CreateIndex(
                name: "ix_study_sessions_request_id",
                table: "study_sessions",
                column: "request_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_user_ratings_ratee_id",
                table: "user_ratings",
                column: "ratee_id");

            migrationBuilder.CreateIndex(
                name: "ix_user_ratings_rater_id",
                table: "user_ratings",
                column: "rater_id");

            migrationBuilder.CreateIndex(
                name: "ix_user_ratings_study_session_id_rater_id_ratee_id",
                table: "user_ratings",
                columns: new[] { "study_session_id", "rater_id", "ratee_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_users_email",
                table: "users",
                column: "email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "messages");

            migrationBuilder.DropTable(
                name: "user_ratings");

            migrationBuilder.DropTable(
                name: "study_sessions");

            migrationBuilder.DropTable(
                name: "requests");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
