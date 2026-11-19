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
        : (this.clientErrorStatus(exception) ??
          HttpStatus.INTERNAL_SERVER_ERROR);
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

  /**
   * Body-parser and similar middleware raise plain errors that carry an
   * exposed 4xx status (413 for an oversized body, 400 for bad JSON). They
   * are the client's fault, so they must not surface as a 500.
   */
  private clientErrorStatus(exception: unknown): number | undefined {
    if (typeof exception !== 'object' || exception === null) return undefined;
    const candidate = exception as {
      status?: unknown;
      statusCode?: unknown;
      expose?: unknown;
    };
    const status = candidate.status ?? candidate.statusCode;
    return candidate.expose === true &&
      typeof status === 'number' &&
      status >= 400 &&
      status < 500
      ? status
      : undefined;
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
      : status === 413
        ? 'PAYLOAD_TOO_LARGE'
        : status === 429
          ? 'RATE_LIMITED'
          : status >= 500
            ? 'INTERNAL_ERROR'
            : 'REQUEST_REJECTED';
  }

  private safeMessage(status: number): string {
    return status === 404
      ? 'The requested resource was not found.'
      : status === 413
        ? 'The request is too large.'
        : status === 429
          ? 'Too many requests. Please wait a moment and try again.'
          : status >= 500
            ? 'The service could not complete the request.'
            : 'The request could not be completed.';
  }
}
