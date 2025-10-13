import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { BusinessRuleException } from '@/common/exceptions/business-rule.exception';

@Catch()
export class GraphQLExceptionFilter implements GqlExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Check if the thrown exception is our business rule error
    if (exception instanceof BusinessRuleException) {
      // Re-throw as an HttpException (usually 400 Bad Request) with the clean message
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: exception.message,
          error: 'Business Rule Violation',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    // Handle other standard HTTP exceptions
    else if (exception instanceof HttpException) {
      throw exception;
    }
    // For all other errors, return a generic 500 (or re-throw for Nest to handle)
    throw new HttpException(
      'Internal Server Error',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
