import type { NextApiRequest, NextApiResponse } from 'next';
import { corsAllMethods, runMiddleware } from '@/utils/cors';
import type { StatPageRecord } from '@/libs/sync';
import type { DBBook } from '@/types/records';

const pageKey = (r: StatPageRecord) => `${r.book_hash}|${r.page}|${r.start_time}`;

export function pickWinningPages(
  incoming: StatPageRecord[],
  server: Map<string, StatPageRecord>,
): { toUpsert: StatPageRecord[] } {
  const toUpsert: StatPageRecord[] = [];
  for (const rec of incoming) {
    const existing = server.get(pageKey(rec));
    if (!existing || rec.duration > existing.duration) toUpsert.push(rec);
  }
  return { toUpsert };
}

export const readingStatusChanged = (client?: string | null, server?: string | null): boolean =>
  (client ?? null) !== (server ?? null);

export function resolveReadingStatusMerge(
  client: Pick<DBBook, 'reading_status' | 'reading_status_updated_at'>,
  server: Pick<DBBook, 'reading_status' | 'reading_status_updated_at'>,
): Pick<DBBook, 'reading_status' | 'reading_status_updated_at'> {
  const ms = (s?: string | null) => (s ? new Date(s).getTime() : 0);
  return ms(client.reading_status_updated_at) >= ms(server.reading_status_updated_at)
    ? {
        reading_status: client.reading_status,
        reading_status_updated_at: client.reading_status_updated_at,
      }
    : {
        reading_status: server.reading_status,
        reading_status_updated_at: server.reading_status_updated_at,
      };
}

export function buildStatusPropagationRow(
  serverBook: DBBook,
  status: Pick<DBBook, 'reading_status' | 'reading_status_updated_at'>,
): DBBook {
  return {
    ...serverBook,
    reading_status: status.reading_status,
    reading_status_updated_at: status.reading_status_updated_at,
  };
}

export function resolveCoverMerge(
  client: Pick<DBBook, 'cover_hash' | 'cover_updated_at'>,
  server: Pick<DBBook, 'cover_hash' | 'cover_updated_at'>,
): Pick<DBBook, 'cover_hash' | 'cover_updated_at'> {
  const ms = (s?: string | null) => (s ? new Date(s).getTime() : 0);
  return ms(client.cover_updated_at) >= ms(server.cover_updated_at)
    ? { cover_hash: client.cover_hash, cover_updated_at: client.cover_updated_at }
    : { cover_hash: server.cover_hash, cover_updated_at: server.cover_updated_at };
}

export function resolveMetadataMerge<T extends { metadata_updated_at?: string | null }>(
  client: T,
  server: T,
  clientRowWins: boolean,
): T {
  const ms = (s?: string | null) => (s ? new Date(s).getTime() : 0);
  const clientMs = ms(client.metadata_updated_at);
  const serverMs = ms(server.metadata_updated_at);
  if (clientMs > serverMs) return client;
  if (serverMs > clientMs) return server;
  return clientRowWins ? client : server;
}

export function bookMetadataChanged(
  a: { title?: string; author?: string; tags?: string[] | null; metadata?: string | null },
  b: { title?: string; author?: string; tags?: string[] | null; metadata?: string | null },
): boolean {
  if (a.title !== b.title) return true;
  if (a.author !== b.author) return true;
  if (JSON.stringify(a.tags ?? []) !== JSON.stringify(b.tags ?? [])) return true;
  if ((a.metadata ?? null) !== (b.metadata ?? null)) return true;
  return false;
}

export async function GET(_req?: any): Promise<Response> {
  return new Response(JSON.stringify({}), { status: 200 });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await runMiddleware(req, res, corsAllMethods);

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiUrl = process.env['NEXT_PUBLIC_BIBLO_API_URL'] || 'http://localhost:3001/api/v0';
  const queryStr = req.url?.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
  const targetUrl = `${apiUrl}/sync${queryStr}`;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (req.headers.authorization) {
      headers['authorization'] = req.headers.authorization;
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method === 'POST') {
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error('Error proxying sync request to Express backend:', error);
    return res.status(500).json({ error: 'Internal Server Error proxying to backend' });
  }
}
