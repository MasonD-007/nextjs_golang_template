'use client';

import { useOptimistic, useState, useRef } from 'react';
import { createItem, updateItem, deleteItem, type Item } from '@/lib/actions';

interface ItemsListProps {
  initialItems: Item[];
}

type OptimisticItem = Item & { isOptimistic?: boolean };

type Action =
  | { type: 'create'; item: OptimisticItem }
  | { type: 'update'; item: OptimisticItem }
  | { type: 'delete'; id: number };

function optimisticReducer(items: OptimisticItem[], action: Action): OptimisticItem[] {
  switch (action.type) {
    case 'create':
      return [action.item, ...items];
    case 'update':
      return items.map((item) => (item.id === action.item.id ? action.item : item));
    case 'delete':
      return items.filter((item) => item.id !== action.id);
    default:
      return items;
  }
}

export default function ItemsList({ initialItems }: ItemsListProps) {
  const [items, updateItems] = useOptimistic(initialItems, optimisticReducer);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleCreate(formData: FormData) {
    setError(null);
    const newItem: OptimisticItem = {
      id: Date.now(),
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      isOptimistic: true,
    };

    updateItems({ type: 'create', item: newItem });
    formRef.current?.reset();

    const result = await createItem(formData);
    if (!result.success) {
      updateItems({ type: 'delete', id: newItem.id });
      setError(result.error || 'Failed to create item');
    }
  }

  async function handleUpdate(id: number, formData: FormData) {
    setError(null);
    const updatedItem: OptimisticItem = {
      id,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      created_at: '',
      updated_at: new Date().toISOString(),
      isOptimistic: true,
    };

    const originalItem = items.find((item) => item.id === id);
    updateItems({ type: 'update', item: updatedItem });
    setEditingId(null);

    const result = await updateItem(id, formData);
    if (!result.success) {
      if (originalItem) {
        updateItems({ type: 'update', item: originalItem });
      }
      setError(result.error || 'Failed to update item');
    }
  }

  async function handleDelete(id: number) {
    setError(null);
    const originalItem = items.find((item) => item.id === id);
    updateItems({ type: 'delete', id });

    const result = await deleteItem(id);
    if (!result.success) {
      if (originalItem) {
        updateItems({ type: 'create', item: originalItem });
      }
      setError(result.error || 'Failed to delete item');
    }
  }

  return (
    <div className="space-y-8">
      <form ref={formRef} action={handleCreate} className="flex flex-col gap-4 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold">Create New Item</h2>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            name="name"
            placeholder="Name"
            required
            className="px-3 py-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700"
          />
          <textarea
            name="description"
            placeholder="Description"
            required
            rows={2}
            className="px-3 py-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Create
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {items.length === 0 ? (
          <p className="text-zinc-500">No items yet. Create one above.</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`p-4 border rounded-lg ${item.isOptimistic ? 'opacity-70' : ''}`}
            >
              {editingId === item.id ? (
                <form
                  action={(formData) => handleUpdate(item.id, formData)}
                  className="flex flex-col gap-2"
                >
                  <input
                    type="text"
                    name="name"
                    defaultValue={item.name}
                    required
                    className="px-3 py-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700"
                  />
                  <textarea
                    name="description"
                    defaultValue={item.description}
                    required
                    rows={2}
                    className="px-3 py-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 border rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <p className="text-zinc-600 dark:text-zinc-400 mt-1">{item.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingId(item.id)}
                        className="px-3 py-1 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="px-3 py-1 text-red-600 border border-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 mt-2">
                    Created: {new Date(item.created_at).toLocaleString()}
                  </p>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
