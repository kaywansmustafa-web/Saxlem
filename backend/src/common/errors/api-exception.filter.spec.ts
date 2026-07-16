import { ArgumentsHost, NotFoundException } from '@nestjs/common';
import { ApiExceptionFilter } from './api-exception.filter';

describe('ApiExceptionFilter', () => {
  it('returns a safe stable envelope', () => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const host = {
      switchToHttp: () => ({
        getRequest: () => ({ requestId: 'request-1' }),
        getResponse: () => ({ status }),
      }),
    } as unknown as ArgumentsHost;
    new ApiExceptionFilter().catch(
      new NotFoundException('internal detail'),
      host,
    );
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      error: {
        code: 'RESOURCE_NOT_FOUND',
        message: 'The requested resource was not found.',
        requestId: 'request-1',
        retryable: false,
        fieldErrors: [],
      },
    });
  });
});
