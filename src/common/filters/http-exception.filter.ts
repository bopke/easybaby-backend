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

      // Log detailed database error information for debugging
      if (isDatabaseError(exception.driverError)) {
        const dbError = exception.driverError;
        this.logger.error(
          `Database error - Code: ${dbError.code}, Detail: ${dbError.detail || 'N/A'}, Query: ${exception.query}`,
          exception.stack,
        );

        // Return generic message to avoid exposing schema details
        switch (dbError.code) {
          case '23505': // Unique constraint violation
          case '23503': // Foreign key constraint violation
          case '23502': // Not null violation
            message = 'Database constraint violation';
            break;
          default:
            message = 'Database operation failed';
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    // Log error with request context (skip if already logged for database errors)
    if (
      !(
        exception instanceof QueryFailedError &&
        isDatabaseError(exception.driverError)
      )
    ) {
      this.logger.error(
        `${request.method} ${request.url} - Status: ${status} - Error: ${
          exception instanceof Error ? exception.message : 'Unknown error'
        }`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
    });
  }
}
