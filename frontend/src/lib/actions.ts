'use server';

import { revalidatePath } from 'next/cache';

const API_URL = process.env.API_URL || 'http://localhost:8080';

export interface Item {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface ActionResult {
  success: boolean;
  data?: Item;
  error?: string;
}

export async function getItems(): Promise<Item[]> {
  try {
    const res = await fetch(`${API_URL}/items`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to fetch items' }));
      throw new Error(error.message || 'Failed to fetch items');
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching items:', error);
    return [];
  }
}

export async function createItem(formData: FormData): Promise<ActionResult> {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;

  if (!name || !description) {
    return { success: false, error: 'Name and description are required' };
  }

  try {
    const res = await fetch(`${API_URL}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to create item' }));
      return { success: false, error: error.message || 'Failed to create item' };
    }

    const item = await res.json();
    revalidatePath('/');
    return { success: true, data: item };
  } catch (error) {
    console.error('Error creating item:', error);
    return { success: false, error: 'Failed to create item' };
  }
}

export async function updateItem(id: number, formData: FormData): Promise<ActionResult> {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;

  if (!name || !description) {
    return { success: false, error: 'Name and description are required' };
  }

  try {
    const res = await fetch(`${API_URL}/items?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to update item' }));
      return { success: false, error: error.message || 'Failed to update item' };
    }

    const item = await res.json();
    revalidatePath('/');
    return { success: true, data: item };
  } catch (error) {
    console.error('Error updating item:', error);
    return { success: false, error: 'Failed to update item' };
  }
}

export async function deleteItem(id: number): Promise<ActionResult> {
  try {
    const res = await fetch(`${API_URL}/items?id=${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to delete item' }));
      return { success: false, error: error.message || 'Failed to delete item' };
    }

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error deleting item:', error);
    return { success: false, error: 'Failed to delete item' };
  }
}
