import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ApiErrorEnvelope, FieldError } from './api-error';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const validationErrors = this.validationErrors(exception);
    const envelope: ApiErrorEnvelope = {
      error: {
        code: validationErrors.length ? 'VALIDATION_FAILED' : this.code(status),
        message: validationErrors.length
          ? 'The request contains invalid values.'
          : this.safeMessage(status),
        requestId: request.requestId ?? 'unavailable',
        retryable: status >= 500,
        fieldErrors: validationErrors,
      },
    };
    response.status(status).json(envelope);
  }

  private validationErrors(exception: unknown): FieldError[] {
    if (!(exception instanceof HttpException)) return [];
    const response = exception.getResponse();
    if (
      typeof response !== 'object' ||
      response === null ||
      !('message' in response)
    )
      return [];
    const messages = response.message;
    if (!Array.isArray(messages)) return [];
    return messages.map((message) => ({
      field: 'request',
      code: 'INVALID_VALUE',
      message: String(message),
    }));
  }

  private code(status: number): string {
    return status === 404
      ? 'RESOURCE_NOT_FOUND'
      : status >= 500
        ? 'INTERNAL_ERROR'
        : 'REQUEST_REJECTED';
  }

  private safeMessage(status: number): string {
    return status === 404
      ? 'The requested resource was not found.'
      : status >= 500
        ? 'The service could not complete the request.'
        : 'The request could not be completed.';
  }
}
