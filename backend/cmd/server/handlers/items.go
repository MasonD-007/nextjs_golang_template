package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/MasonD-007/template/backend/internal/db"
	"github.com/jackc/pgx/v5/pgtype"
)

// ListItems godoc
// @Summary List all items
// @Description Get all items sorted by creation date
// @Tags items
// @Accept json
// @Produce json
// @Success 200 {array} Item
// @Failure 500 {object} Error
// @Router /items [get]
func ListItems(q *db.Queries) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		items, err := q.ListItems(r.Context())
		if err != nil {
			http.Error(w, "Failed to fetch items", http.StatusInternalServerError)
			return
		}

		if items == nil {
			items = []db.Item{}
		}

		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(items)
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}

	}
}

// GetItem godoc
// @Summary Get an item
// @Description Get item by ID
// @Tags items
// @Accept json
// @Produce json
// @Param id query int true "Item ID"
// @Success 200 {object} Item
// @Failure 400 {object} Error
// @Failure 404 {object} Error
// @Router /items [get]
func GetItem(q *db.Queries) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.URL.Query().Get("id")
		if idStr == "" {
			ListItems(q)(w, r)
			return
		}

		id, err := strconv.ParseInt(idStr, 10, 32)
		if err != nil {
			http.Error(w, "Invalid id", http.StatusBadRequest)
			return
		}

		item, err := q.GetItem(r.Context(), int32(id))
		if err != nil {
			http.Error(w, "Item not found", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(item)
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
	}
}

// CreateItem godoc
// @Summary Create an item
// @Description Create a new item
// @Tags items
// @Accept json
// @Produce json
// @Param item body CreateItemRequest true "Item data"
// @Success 201 {object} Item
// @Failure 400 {object} Error
// @Failure 500 {object} Error
// @Router /items [post]
func CreateItem(q *db.Queries) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var params CreateItemRequest
		if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		item, err := q.CreateItem(r.Context(), db.CreateItemParams{
			Name:        params.Name,
			Description: pgtype.Text{String: params.Description, Valid: true},
		})
		if err != nil {
			http.Error(w, "Failed to create item", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		err = json.NewEncoder(w).Encode(item)
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
	}
}

// DeleteItem godoc
// @Summary Delete an item
// @Description Delete item by ID
// @Tags items
// @Accept json
// @Produce json
// @Param id query int true "Item ID"
// @Success 204
// @Failure 400 {object} Error
// @Failure 500 {object} Error
// @Router /items [delete]
func DeleteItem(q *db.Queries) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.URL.Query().Get("id")
		id, err := strconv.ParseInt(idStr, 10, 32)
		if err != nil {
			http.Error(w, "Invalid id", http.StatusBadRequest)
			return
		}

		if err := q.DeleteItem(r.Context(), int32(id)); err != nil {
			http.Error(w, "Failed to delete item", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}

// UpdateItem godoc
// @Summary Update an item
// @Description Update item by ID
// @Tags items
// @Accept json
// @Produce json
// @Param id query int true "Item ID"
// @Param item body UpdateItemRequest true "Item data"
// @Success 200 {object} Item
// @Failure 400 {object} Error
// @Failure 500 {object} Error
// @Router /items [put]
func UpdateItem(q *db.Queries) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.URL.Query().Get("id")
		id, err := strconv.ParseInt(idStr, 10, 32)
		if err != nil {
			http.Error(w, "Invalid id", http.StatusBadRequest)
			return
		}

		var params UpdateItemRequest
		if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		item, err := q.UpdateItem(r.Context(), db.UpdateItemParams{
			ID:          int32(id),
			Name:        params.Name,
			Description: pgtype.Text{String: params.Description, Valid: true},
		})
		if err != nil {
			http.Error(w, "Failed to update item", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(item)
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
	}
}

type CreateItemRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

type UpdateItemRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

type Error struct {
	Message string `json:"message"`
}

// Item represents an item in the database
type Item struct {
	ID          int32  `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}
