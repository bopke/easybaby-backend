import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { AllExceptionsFilter } from './http-exception.filter';

interface MockRequest extends Partial<Request> {
  method: string;
  url: string;
}

interface MockResponse extends Partial<Response> {
  status: jest.Mock;
}

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockArgumentsHost: ArgumentsHost;
  let mockRequest: MockRequest;
  let mockResponse: MockResponse;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let loggerErrorSpy: jest.SpyInstance;

  const createQueryFailedErrorWithDriverError = (
    query: string,
    driverError: unknown,
  ): QueryFailedError => {
    const exception = new QueryFailedError(query, [], new Error('db error'));
    Object.defineProperty(exception, 'driverError', {
      value: driverError,
      writable: true,
      configurable: true,
    });
    return exception;
  };

  beforeEach(() => {
    filter = new AllExceptionsFilter();

    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockResponse = {
      status: mockStatus,
    };

    mockRequest = {
      method: 'GET',
      url: '/test',
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
      getArgByIndex: jest.fn(),
      getArgs: jest.fn(),
      getType: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    };

    loggerErrorSpy = jest.spyOn(filter['logger'], 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('HttpException handling', () => {
    it('should handle HttpException with string message', () => {
      const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        statusCode: 404,
        message: 'Not found',
        error: 'Internal Server Error',
      });
    });

    it('should handle HttpException with object response', () => {
      const exception = new HttpException(
        {
          message: 'Validation failed',
          error: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        statusCode: 400,
        message: 'Validation failed',
        error: 'Bad Request',
      });
    });

    it('should handle HttpException with array message', () => {
      const exception = new HttpException(
        {
          message: ['email must be valid', 'password is required'],
          error: 'Validation Error',
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        statusCode: 400,
        message: ['email must be valid', 'password is required'],
        error: 'Validation Error',
      });
    });

    it('should use default error when response object has no error field', () => {
      const exception = new HttpException(
        {
          message: 'Custom message',
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith({
        statusCode: 400,
        message: 'Custom message',
        error: 'Internal Server Error',
      });
    });
  });

  describe('QueryFailedError handling (Database errors)', () => {
    it('should handle unique constraint violation (23505)', () => {
      const exception = createQueryFailedErrorWithDriverError(
        'INSERT INTO users...',
        { code: '23505' },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        statusCode: 400,
        message: 'Database constraint violation',
        error: 'Database Error',
      });
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Database error - Code: 23505'),
        expect.any(String),
      );
    });

    it('should handle foreign key constraint violation (23503)', () => {
      const exception = createQueryFailedErrorWithDriverError(
        'INSERT INTO posts...',
        { code: '23503' },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        statusCode: 400,
        message: 'Database constraint violation',
        error: 'Database Error',
      });
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Database error - Code: 23503'),
        expect.any(String),
      );
    });

    it('should handle not null constraint violation (23502)', () => {
      const exception = createQueryFailedErrorWithDriverError(
        'INSERT INTO users...',
        { code: '23502' },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        statusCode: 400,
        message: 'Database constraint violation',
        error: 'Database Error',
      });
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Database error - Code: 23502'),
        expect.any(String),
      );
    });

    it('should handle QueryFailedError with unknown code', () => {
      const exception = createQueryFailedErrorWithDriverError(
        'SELECT * FROM users...',
        { code: '99999' },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        statusCode: 400,
        message: 'Database operation failed',
        error: 'Database Error',
      });
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Database error - Code: 99999'),
        expect.any(String),
      );
    });

    it('should handle QueryFailedError without driverError', () => {
      const exception = new QueryFailedError(
        'SELECT * FROM users...',
        [],
        new Error('some error'),
      );
      // No driverError property

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        statusCode: 400,
        message: 'Database operation failed',
        error: 'Database Error',
      });
    });

    it('should handle QueryFailedError with non-object driverError', () => {
      const exception = createQueryFailedErrorWithDriverError(
        'SELECT * FROM users...',
        'string error',
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        statusCode: 400,
        message: 'Database operation failed',
        error: 'Database Error',
      });
    });
  });

  describe('Generic Error handling', () => {
    it('should handle generic Error', () => {
      const exception = new Error('Something went wrong');

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        statusCode: 500,
        message: 'Something went wrong',
        error: 'Error',
      });
    });

    it('should handle custom Error with custom name', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }
      const exception = new CustomError('Custom error occurred');

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        statusCode: 500,
        message: 'Custom error occurred',
        error: 'CustomError',
      });
    });
  });

  describe('Unknown exception handling', () => {
    it('should handle unknown exception type (not Error)', () => {
      const exception = { someProperty: 'someValue' };

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
      });
    });

    it('should handle null exception', () => {
      const exception = null;

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
      });
    });

    it('should handle string exception', () => {
      const exception = 'some error string';

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
      });
    });
  });

  describe('Logging', () => {
    it('should log error with request context for Error instances', () => {
      const exception = new Error('Test error');
      exception.stack = 'Error stack trace';

      filter.catch(exception, mockArgumentsHost);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'GET /test - Status: 500 - Error: Test error',
        'Error stack trace',
      );
    });

    it('should log error with request context for HttpException', () => {
      const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockArgumentsHost);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'GET /test - Status: 404 - Error: Not found',
        expect.any(String), // HttpException has a stack trace
      );
    });

    it('should log "Unknown error" for non-Error exceptions', () => {
      const exception = { someProperty: 'someValue' };

      filter.catch(exception, mockArgumentsHost);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'GET /test - Status: 500 - Error: Unknown error',
        undefined,
      );
    });

    it('should include correct HTTP method and URL in log', () => {
      mockRequest.method = 'POST';
      mockRequest.url = '/users/create';
      const exception = new Error('Test error');

      filter.catch(exception, mockArgumentsHost);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('POST /users/create'),
        expect.any(String),
      );
    });
  });
});
