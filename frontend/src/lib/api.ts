import createClient from 'openapi-fetch';
import type { paths } from './openapi';

const baseUrl = process.env.API_URL || 'http://localhost:8080';

export const api = createClient<paths>({
  baseUrl,
});

export type { paths };
