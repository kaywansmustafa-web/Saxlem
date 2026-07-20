export type DatabasePurpose = 'development' | 'test';

export function assertSafeDatabaseUrl(
  value: string | undefined,
  purpose: DatabasePurpose,
): URL {
  if (!value?.trim()) throw new Error('Database URL is required.');
  const url = new URL(value);
  const database = url.pathname.replace(/^\//, '');
  const expected = purpose === 'test' ? 'saxlem_test' : 'saxlem_development';
  if (database !== expected)
    throw new Error(
      `Refusing ${purpose} operation for database '${database || 'empty'}'.`,
    );
  if (!['localhost', '127.0.0.1'].includes(url.hostname))
    throw new Error('Database operations are restricted to localhost.');
  if (/prod|production/i.test(database))
    throw new Error('Production-like database targets are forbidden.');
  return url;
}
