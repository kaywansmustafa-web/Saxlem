import { generateKeyPairSync, createVerify } from 'node:crypto';
import { FcmPushGateway } from './push-gateway';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
});
const account = {
  projectId: 'saxlem-test',
  clientEmail: 'push@saxlem-test.iam.gserviceaccount.com',
  privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
};
const message = {
  title: "It's your turn",
  body: 'Ticket 12',
  data: { notificationId: 'n1', type: 'queue.patient.called' },
  urgent: true,
};

function fakeFetch(sendStatus: number, sendBody = '{}') {
  const calls: { url: string; init: { body: string; headers: unknown } }[] = [];
  const fetcher = ((url: string, init: { body: string; headers: unknown }) => {
    calls.push({ url, init });
    if (url.startsWith('https://oauth2.googleapis.com/token'))
      return Promise.resolve(
        new Response(
          JSON.stringify({ access_token: 'ya29.x', expires_in: 3600 }),
          {
            status: 200,
          },
        ),
      );
    return Promise.resolve(new Response(sendBody, { status: sendStatus }));
  }) as unknown as typeof fetch;
  return { calls, fetcher };
}

describe('FCM push', () => {
  it('signs in once with a valid service-account JWT and sends', async () => {
    const { calls, fetcher } = fakeFetch(200);
    const gateway = new FcmPushGateway(
      account,
      fetcher,
      () => 1_800_000_000_000,
    );
    expect(await gateway.send('token-aaaaaaaaaaaaaaaaaaaa', message)).toBe(
      'sent',
    );
    expect(await gateway.send('token-bbbbbbbbbbbbbbbbbbbb', message)).toBe(
      'sent',
    );
    const signIns = calls.filter((c) => c.url.includes('oauth2'));
    expect(signIns).toHaveLength(1);
    const assertion = new URLSearchParams(signIns[0]!.init.body).get(
      'assertion',
    )!;
    const [header, claims, signature] = assertion.split('.');
    expect(
      createVerify('RSA-SHA256')
        .update(`${header}.${claims}`)
        .verify(publicKey, Buffer.from(signature!, 'base64url')),
    ).toBe(true);
    expect(
      JSON.parse(Buffer.from(claims!, 'base64url').toString()),
    ).toMatchObject({
      iss: account.clientEmail,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
    });
    const send = calls.find((c) => c.url.includes('fcm.googleapis.com'))!;
    expect(send.url).toBe(
      'https://fcm.googleapis.com/v1/projects/saxlem-test/messages:send',
    );
    expect((send.init.headers as Record<string, string>).authorization).toBe(
      'Bearer ya29.x',
    );
    expect(JSON.parse(send.init.body)).toMatchObject({
      message: {
        fid: 'token-aaaaaaaaaaaaaaaaaaaa',
        notification: { title: "It's your turn", body: 'Ticket 12' },
        data: { notificationId: 'n1' },
        android: {
          priority: 'HIGH',
          notification: { channel_id: 'saxlem_updates' },
        },
        apns: { headers: { 'apns-priority': '10' } },
      },
    });
  });

  it('tells a dead token from a failed send', async () => {
    const gone = fakeFetch(
      404,
      JSON.stringify({ error: { details: [{ errorCode: 'UNREGISTERED' }] } }),
    );
    expect(
      await new FcmPushGateway(account, gone.fetcher).send(
        't'.repeat(30),
        message,
      ),
    ).toBe('invalid-token');
    const down = fakeFetch(503);
    expect(
      await new FcmPushGateway(account, down.fetcher).send(
        't'.repeat(30),
        message,
      ),
    ).toBe('failed');
  });
});
