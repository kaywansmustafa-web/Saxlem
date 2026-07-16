import { join } from 'node:path';
import SwaggerParser from '@apidevtools/swagger-parser';

async function validate(): Promise<void> {
  await SwaggerParser.validate(join(process.cwd(), 'openapi/saxlem-api.json'));
}

void validate();
