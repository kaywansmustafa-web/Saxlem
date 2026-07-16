import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('backend architecture boundaries', () => {
  it('reserves every product endpoint under /api/v1', () => {
    const source = readFileSync(join(process.cwd(), 'src/main.ts'), 'utf8');
    expect(source).toContain('PRODUCT_API_PREFIX');
    expect(
      readFileSync(
        join(process.cwd(), 'src/common/api/api.constants.ts'),
        'utf8',
      ),
    ).toContain("'api/v1'");
  });

  it('does not install prohibited infrastructure', () => {
    const packageJson = readFileSync(
      join(process.cwd(), 'package.json'),
      'utf8',
    );
    for (const prohibited of ['redis', 'bullmq', 'kafka', 'rabbitmq']) {
      expect(packageJson.toLowerCase()).not.toContain(`"${prohibited}"`);
    }
  });

  it('contains no product controllers', () => {
    const moduleSource = readFileSync(
      join(process.cwd(), 'src/modules/foundation-modules.module.ts'),
      'utf8',
    );
    expect(moduleSource).not.toContain('Controller(');
  });
});
