using Microsoft.EntityFrameworkCore;
using Peerly.Api.Models;

namespace Peerly.Api.Data;

public class PeerlyDbContext(DbContextOptions<PeerlyDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<StudyRequest> Requests => Set<StudyRequest>();
    public DbSet<StudySession> StudySessions => Set<StudySession>();
    public DbSet<UserRating> UserRatings => Set<UserRating>();
    public DbSet<Message> Messages => Set<Message>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(user =>
        {
            user.Property(u => u.Name).HasMaxLength(255);
            user.Property(u => u.Email).HasMaxLength(255);
            user.Property(u => u.PasswordHash).HasMaxLength(255);
            user.Property(u => u.Major).HasMaxLength(100);
            user.Property(u => u.Version).IsRowVersion();
            user.HasIndex(u => u.Email).IsUnique();
        });

        modelBuilder.Entity<StudyRequest>(request =>
        {
            request.Property(r => r.Subject).HasMaxLength(255);
        });

        modelBuilder.Entity<UserRating>(rating =>
        {
            rating.HasIndex(r => new { r.StudySessionId, r.RaterId, r.RateeId }).IsUnique();
            rating.ToTable(table =>
            {
                table.HasCheckConstraint("ck_user_ratings_stars", "stars BETWEEN 1 AND 5");
                table.HasCheckConstraint("ck_user_ratings_not_self", "rater_id <> ratee_id");
            });
        });
    }
}
