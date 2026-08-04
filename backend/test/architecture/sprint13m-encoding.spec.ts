import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Sprint 13M queue and arrival UTF-8 safety', () => {
  it('rejects known mojibake markers in related production contracts', () => {
    const paths = [
      'src/modules/queue/presentation/queue.controller.ts',
      'src/modules/queue/presentation/queue.dto.ts',
      'src/modules/arrivals/presentation/arrivals.controller.ts',
      'docs/LIVE_QUEUE_API.md',
      'docs/LIVE_QUEUE_DOMAIN.md',
      'docs/PATIENT_ARRIVAL_DOMAIN.md',
      'openapi/saxlem-api.json',
    ];
    for (const path of paths) {
      const value = readFileSync(join(process.cwd(), path), 'utf8');
      expect(value).not.toMatch(/â|Ã|ΓÇ|├|┬|\uFFFD/u);
    }
  });
});
