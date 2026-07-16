import type { NextFunction, Request, Response } from 'express';
import {
  RequestIdMiddleware,
  REQUEST_ID_HEADER,
} from './request-id.middleware';

describe('RequestIdMiddleware', () => {
  it('preserves a bounded caller request id', () => {
    const request = { header: () => 'caller-id' } as unknown as Request;
    const setHeader = jest.fn();
    const response = { setHeader } as unknown as Response;
    const next = jest.fn() as NextFunction;
    new RequestIdMiddleware().use(request, response, next);
    expect(request.requestId).toBe('caller-id');
    expect(setHeader).toHaveBeenCalledWith(REQUEST_ID_HEADER, 'caller-id');
    expect(next).toHaveBeenCalled();
  });
});
