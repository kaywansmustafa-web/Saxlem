import { sanitizeLoggedRequest } from '../../app.module';

describe('request logging privacy', () => {
  it('removes query strings and parsed query values from structured logs', () => {
    const logged = sanitizeLoggedRequest({
      method: 'GET',
      url: '/api/v1/patients/directory?q=%2B9647500000000&cursor=private-cursor',
      query: { q: '+9647500000000', cursor: 'private-cursor' },
      headers: { authorization: '[REDACTED]' },
    });
    expect(logged).toEqual({
      method: 'GET',
      url: '/api/v1/patients/directory',
      headers: { authorization: '[REDACTED]' },
    });
    expect(JSON.stringify(logged)).not.toMatch(/9647500000000|private-cursor/u);
  });
});
