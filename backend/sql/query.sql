-- name: CreateItem :one 
INSERT INTO items(
    name,
    description
)
VALUES ($1, $2) RETURNING id,
name,
description,
created_at,
updated_at;

-- name: GetItem :one
SELECT
    id,
    name,
    description,
    created_at,
    updated_at
FROM
    items
WHERE
    id = $1;

-- name: UpdateItem :one
UPDATE items
SET name = $2,
description = $3,
updated_at = NOW()
WHERE
    id = $1 RETURNING id,
    name,
    description,
    created_at,
    updated_at;

-- name: DeleteItem :exec
DELETE FROM items
WHERE
    id = $1;

-- name: ListItems :many
SELECT
    id,
    name,
    description,
    created_at,
    updated_at
FROM
    items
ORDER BY
    created_at DESC;
