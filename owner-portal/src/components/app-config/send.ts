/** Calls the Owner Portal's own API for catalog and settings changes. */
export async function send(
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<{ ok: true; result: unknown } | { ok: false; message: string }> {
  try {
    const response = await fetch(`/api/platform/app/${path}`, {
      method,
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = (await response.json()) as {
      ok?: boolean;
      result?: unknown;
      error?: { message?: string };
    };
    if (response.ok && json.ok) return { ok: true, result: json.result };
    return { ok: false, message: json.error?.message ?? "Couldn't save. Try again." };
  } catch {
    return { ok: false, message: "Couldn't reach Saxlem. Check the connection and try again." };
  }
}

/** Moves one id up or down in a list (for the order buttons). */
export function moved(ids: readonly string[], id: string, by: -1 | 1): string[] {
  const next = [...ids];
  const index = next.indexOf(id);
  const target = index + by;
  if (index < 0 || target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}
