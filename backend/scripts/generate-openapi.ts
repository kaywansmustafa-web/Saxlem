import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  createOpenApiApplication,
  createOpenApiDocument,
} from './openapi-application';

async function generate(): Promise<void> {
  const app = await createOpenApiApplication();
  const document = createOpenApiDocument(app);
  const directory = join(process.cwd(), 'openapi');
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    join(directory, 'saxlem-api.json'),
    `${JSON.stringify(document, null, 2)}\n`,
  );
  await app.close();
}

void generate();
