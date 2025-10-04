const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function getJSON<T = any>(path: string): Promise<T> {
  const res = await fetch(BASE_URL + path);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function postJSON<TResp = any, TBody = any>(path: string, body: TBody): Promise<TResp> {
  const res = await fetch(BASE_URL + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json() as Promise<TResp>;
}

export async function patchJSON<TResp = any, TBody = any>(path: string, body: TBody): Promise<TResp> {
  const res = await fetch(BASE_URL + path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if(!res.ok) throw new Error(`PATCH ${path} failed: ${res.status}`);
  return res.json() as Promise<TResp>;
}
