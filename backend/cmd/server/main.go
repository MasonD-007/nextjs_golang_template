package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/MasonD-007/template/backend/cmd/server/handlers"
	_ "github.com/MasonD-007/template/backend/docs"
	"github.com/MasonD-007/template/backend/internal/db"
	"github.com/MasonD-007/template/backend/internal/db/postgres"
	"github.com/joho/godotenv"
	httpSwagger "github.com/swaggo/http-swagger/v2"
)

// @title Items API
// @version 1.0
// @description API for managing items
// @host localhost:8080
// @BasePath /
func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is not set in environment variables")
	}

	conn, err := postgres.Connect(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer conn.Close()

	q := db.New(conn)

	http.HandleFunc("/items", func(w http.ResponseWriter, r *http.Request) {
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
	})

	http.HandleFunc("/swagger/*", httpSwagger.Handler())

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, err = w.Write([]byte("OK"))
		if err != nil {
			log.Printf("Failed to write health check response: %v", err)
		}
	})

	fmt.Println("Server starting on :8080")
	fmt.Println("Swagger docs at http://localhost:8080/swagger/index.html")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
