'use server';

import { revalidatePath } from 'next/cache';
import { logInfo, logError } from './logger';

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
  logInfo('getItems', 'START', { apiUrl: API_URL });

  try {
    logInfo('getItems', 'FETCH_REQUEST', { url: `${API_URL}/items`, method: 'GET' });

    const res = await fetch(`${API_URL}/items`, {
      cache: 'no-store',
    });

    logInfo('getItems', 'FETCH_RESPONSE', { status: res.status, statusText: res.statusText });

    if (!res.ok) {
      const errorBody = await res.text();
      logError('getItems', 'FETCH_ERROR', `HTTP ${res.status}: ${res.statusText}`, { body: errorBody });
      const error = await res.json().catch(() => ({ message: 'Failed to fetch items' }));
      throw new Error(error.message || 'Failed to fetch items');
    }

    const items = await res.json();
    logInfo('getItems', 'SUCCESS', { count: items.length });
    return items;
  } catch (error) {
    logError('getItems', 'ERROR', error as Error, { apiUrl: API_URL });
    return [];
  }
}

export async function createItem(formData: FormData): Promise<ActionResult> {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;

  logInfo('createItem', 'START', { apiUrl: API_URL, name, description });

  if (!name || !description) {
    logError('createItem', 'VALIDATION_ERROR', 'Name and description are required', { name: !!name, description: !!description });
    return { success: false, error: 'Name and description are required' };
  }

  try {
    logInfo('createItem', 'FETCH_REQUEST', {
      url: `${API_URL}/items`,
      method: 'POST',
      body: { name, description }
    });

    const res = await fetch(`${API_URL}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });

    const responseBody = await res.text();
    logInfo('createItem', 'FETCH_RESPONSE', {
      status: res.status,
      statusText: res.statusText,
      body: responseBody
    });

    if (!res.ok) {
      logError('createItem', 'FETCH_ERROR', `HTTP ${res.status}: ${res.statusText}`, { body: responseBody });
      const error = JSON.parse(responseBody);
      return { success: false, error: error.message || 'Failed to create item' };
    }

    const item = JSON.parse(responseBody);
    logInfo('createItem', 'SUCCESS', { itemId: item.id });
    revalidatePath('/items');
    return { success: true, data: item };
  } catch (error) {
    logError('createItem', 'ERROR', error as Error, { apiUrl: API_URL, name, description });
    return { success: false, error: 'Failed to create item' };
  }
}

export async function updateItem(id: number, formData: FormData): Promise<ActionResult> {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;

  logInfo('updateItem', 'START', { apiUrl: API_URL, id, name, description });

  if (!name || !description) {
    logError('updateItem', 'VALIDATION_ERROR', 'Name and description are required', { id, name: !!name, description: !!description });
    return { success: false, error: 'Name and description are required' };
  }

  try {
    logInfo('updateItem', 'FETCH_REQUEST', {
      url: `${API_URL}/items?id=${id}`,
      method: 'PUT',
      body: { name, description }
    });

    const res = await fetch(`${API_URL}/items?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });

    const responseBody = await res.text();
    logInfo('updateItem', 'FETCH_RESPONSE', {
      status: res.status,
      statusText: res.statusText,
      body: responseBody
    });

    if (!res.ok) {
      logError('updateItem', 'FETCH_ERROR', `HTTP ${res.status}: ${res.statusText}`, { body: responseBody });
      const error = JSON.parse(responseBody);
      return { success: false, error: error.message || 'Failed to update item' };
    }

    const item = JSON.parse(responseBody);
    logInfo('updateItem', 'SUCCESS', { itemId: item.id });
    revalidatePath('/items');
    return { success: true, data: item };
  } catch (error) {
    logError('updateItem', 'ERROR', error as Error, { apiUrl: API_URL, id });
    return { success: false, error: 'Failed to update item' };
  }
}

export async function deleteItem(id: number): Promise<ActionResult> {
  logInfo('deleteItem', 'START', { apiUrl: API_URL, id });

  try {
    logInfo('deleteItem', 'FETCH_REQUEST', {
      url: `${API_URL}/items?id=${id}`,
      method: 'DELETE'
    });

    const res = await fetch(`${API_URL}/items?id=${id}`, {
      method: 'DELETE',
    });

    const responseBody = await res.text();
    logInfo('deleteItem', 'FETCH_RESPONSE', {
      status: res.status,
      statusText: res.statusText,
      body: responseBody
    });

    if (!res.ok) {
      logError('deleteItem', 'FETCH_ERROR', `HTTP ${res.status}: ${res.statusText}`, { body: responseBody });
      const error = JSON.parse(responseBody);
      return { success: false, error: error.message || 'Failed to delete item' };
    }

    logInfo('deleteItem', 'SUCCESS', { id });
    revalidatePath('/items');
    return { success: true };
  } catch (error) {
    logError('deleteItem', 'ERROR', error as Error, { apiUrl: API_URL, id });
    return { success: false, error: 'Failed to delete item' };
  }
}
