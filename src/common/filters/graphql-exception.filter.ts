import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GqlExceptionFilter, GqlExecutionContext } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { BusinessRuleException } from '../exceptions/business-rule.exception';

/**
 * Global filter to catch exceptions thrown from the service layer and
 * format them into a standardized, client-friendly GraphQL error response.
 */
@Catch()
export class GraphQLExceptionFilter implements GqlExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    let status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = 'An unexpected server error occurred.';
    let errorType: string = 'InternalServerError';

    // 1. Intercept Business Rule Exceptions (The error we created)
    if (exception instanceof BusinessRuleException) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.message;
      errorType = 'BusinessRuleViolation'; // Custom code for client-side logic
    }
    // 2. Intercept Standard NestJS HTTP Exceptions (e.g., from Guards)
    else if (exception instanceof HttpException) {
      status = exception.getStatus();

      // Handle the HttpException's response body, which can be an object or string
      const response = exception.getResponse();
      message =
        typeof response === 'string'
          ? response
          : (response as any).message || exception.message;
      errorType = exception.name;
    }

    // Only include the minimal fields requested by the frontend.
    const extensions: Record<string, any> = {
      statusCode: status,
      errorType,
    };

    return new GraphQLError(message, { extensions });
  }
}
