import type { NextFunction, Request, Response } from 'express';
import { requestBudget } from './http-hardening';

function call(
  budget: ReturnType<typeof requestBudget>,
  method = 'GET',
  ip = '10.0.0.1',
  path = '/api/v1/doctors',
) {
  let status = 200;
  let passed = false;
  const response = {
    setHeader: () => undefined,
    json: () => undefined,
  } as unknown as Response;
  response.status = (code: number) => {
    status = code;
    return response;
  };
  budget({ method, ip, path, socket: {} } as Request, response, (() => {
    passed = true;
  }) as NextFunction);
  return passed ? 200 : status;
}

describe('requestBudget', () => {
  it('lets an address make its budget and then answers 429', () => {
    let time = 0;
    const budget = requestBudget(10, () => time);
    for (let i = 0; i < 10; i++) expect(call(budget)).toBe(200);
    expect(call(budget)).toBe(429);
    expect(call(budget, 'GET', '10.0.0.2')).toBe(200);
    time = 60_001;
    expect(call(budget)).toBe(200);
  });

  it('gives writes a fifth of the budget', () => {
    const budget = requestBudget(10, () => 0);
    expect(call(budget, 'POST')).toBe(200);
    expect(call(budget, 'POST')).toBe(200);
    expect(call(budget, 'POST')).toBe(429);
  });

  it('never limits health checks', () => {
    const budget = requestBudget(1, () => 0);
    for (let i = 0; i < 5; i++)
      expect(call(budget, 'GET', '10.0.0.1', '/health/ready')).toBe(200);
  });
});
