package migrate

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/pgx/v5"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5/pgxpool"
)

// RunMigrations runs all pending database migrations
func RunMigrations(ctx context.Context, pool *pgxpool.Pool) error {
	// Get a database/sql connection from pgx
	connConfig := pool.Config().ConnConfig
	dsn := fmt.Sprintf("postgresql://%s:%s@%s/%s?sslmode=%s",
		connConfig.User,
		connConfig.Password,
		connConfig.Host,
		connConfig.Database,
		connConfig.TLSConfig,
	)

	// If no TLS, set sslmode to disable
	if connConfig.TLSConfig == nil {
		dsn = fmt.Sprintf("postgresql://%s:%s@%s/%s?sslmode=disable",
			connConfig.User,
			connConfig.Password,
			connConfig.Host,
			connConfig.Database,
		)
	}

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return fmt.Errorf("failed to open database for migrations: %w", err)
	}
	defer db.Close()

	driver, err := pgx.WithInstance(db, &pgx.Config{})
	if err != nil {
		return fmt.Errorf("failed to create migration driver: %w", err)
	}
	defer driver.Close()

	m, err := migrate.NewWithDatabaseInstance(
		"file://migrations",
		"pgx",
		driver,
	)
	if err != nil {
		return fmt.Errorf("failed to create migrate instance: %w", err)
	}

	log.Printf("[%s] [INFO] [migrate] Running migrations...", time.Now().Format(time.RFC3339))

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	if err == migrate.ErrNoChange {
		log.Printf("[%s] [INFO] [migrate] No migrations to run", time.Now().Format(time.RFC3339))
	} else {
		log.Printf("[%s] [INFO] [migrate] Migrations completed successfully", time.Now().Format(time.RFC3339))
	}

	return nil
}
