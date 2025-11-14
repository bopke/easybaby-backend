import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

interface HttpExceptionResponse {
  message: string | string[];
  error?: string;
}

interface DatabaseError {
  code: string;
  detail?: string;
}

function isDatabaseError(error: unknown): error is DatabaseError {
  return typeof error === 'object' && error !== null && 'code' in error;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        const response = exceptionResponse as HttpExceptionResponse;
        message = response.message || message;
        error = response.error || error;
      }
    } else if (exception instanceof QueryFailedError) {
      status = HttpStatus.BAD_REQUEST;
      error = 'Database Error';
      message = 'Database operation failed';

      if (isDatabaseError(exception.driverError)) {
        const dbError = exception.driverError;
        switch (dbError.code) {
          case '23505':
            // Unique constraint violation
            message = 'A record with this value already exists';
            break;
          case '23503':
            // Foreign key constraint violation
            message = 'Referenced record does not exist';
            break;
          case '23502':
            // Not null violation
            message = 'Required field is missing';
            break;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - Error: ${
        exception instanceof Error ? exception.message : 'Unknown error'
      }`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      statusCode: status,
      message,
      error,
    });
  }
}
