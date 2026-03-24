package main

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/MasonD-007/template/backend/cmd/server/handlers"
	_ "github.com/MasonD-007/template/backend/docs"
	"github.com/MasonD-007/template/backend/internal/db"
	"github.com/MasonD-007/template/backend/internal/db/migrate"
	"github.com/MasonD-007/template/backend/internal/db/postgres"
	"github.com/joho/godotenv"
	httpSwagger "github.com/swaggo/http-swagger/v2"
)

// responseWriter wraps http.ResponseWriter to capture status code
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

// loggingMiddleware logs all requests and responses
func loggingMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Read request body
		bodyBytes, _ := io.ReadAll(r.Body)
		r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

		// Log request
		log.Printf("[%s] [INFO] [http] [%s %s] remote=%s body=%s",
			start.Format(time.RFC3339),
			r.Method,
			r.URL.Path,
			r.RemoteAddr,
			string(bodyBytes))

		// Capture response
		wrapped := &responseWriter{ResponseWriter: w, statusCode: 200}
		next(wrapped, r)

		// Log response
		log.Printf("[%s] [INFO] [http] [%s %s] status=%d duration=%dms",
			time.Now().Format(time.RFC3339),
			r.Method,
			r.URL.Path,
			wrapped.statusCode,
			time.Since(start).Milliseconds())
	}
}

// @title Items API
// @version 1.0
// @description API for managing items
// @host localhost:8080
// @BasePath /
func main() {
	// Load .env file if it exists (optional for local dev, not needed in Docker)
	_ = godotenv.Load()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is not set in environment variables")
	}

	log.Printf("[%s] [INFO] [main] [START] database_url=%s", time.Now().Format(time.RFC3339), dbURL)

	conn, err := postgres.Connect(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer conn.Close()

	log.Printf("[%s] [INFO] [main] [DB_CONNECTED]", time.Now().Format(time.RFC3339))

	// Run database migrations
	if err := migrate.RunMigrations(context.Background(), conn); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	q := db.New(conn)

	http.HandleFunc("/items", loggingMiddleware(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.GetItem(q)(w, r)
		case http.MethodPost:
			handlers.CreateItem(q)(w, r)
		case http.MethodDelete:
			handlers.DeleteItem(q)(w, r)
		case http.MethodPut:
			handlers.UpdateItem(q)(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	http.HandleFunc("/swagger/*", httpSwagger.Handler())

	http.HandleFunc("/health", loggingMiddleware(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, err = w.Write([]byte("OK"))
		if err != nil {
			log.Printf("[%s] [INFO] [health] [ERROR] error=%v", time.Now().Format(time.RFC3339), err)
		}
	}))

	log.Printf("[%s] [INFO] [main] [SERVER_START] port=8080", time.Now().Format(time.RFC3339))
	fmt.Println("Server starting on :8080")
	fmt.Println("Swagger docs at http://localhost:8080/swagger/index.html")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
