import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GqlExceptionFilter, GqlExecutionContext } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { BusinessRuleException } from '../exceptions/business-rule.exception';
// ... (imports remain the same)
import { Logger } from '@nestjs/common'; // Import NestJS Logger

@Catch()
export class GraphQLExceptionFilter implements GqlExceptionFilter {
  private readonly logger = new Logger(GraphQLExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    let status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = 'An unexpected server error occurred.';
    let errorType: string = 'INTERNAL_SERVER_ERROR'; // Use uppercase for convention

    if (exception instanceof BusinessRuleException) {
      status = HttpStatus.BAD_REQUEST; // or 422 UNPROCESSABLE_ENTITY
      message = exception.message;
      errorType = 'BUSINESS_RULE_VIOLATION'; // Consistent uppercase code
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();

      // Extract the message and standardize the errorType code
      message =
        typeof response === 'string'
          ? response
          : (response as any).message || exception.message;
      errorType = HttpStatus[status] || 'HTTP_EXCEPTION'; // e.g., "UNAUTHORIZED" or "NOT_FOUND"

      // Log non-5xx exceptions as warnings or info
      if (status >= 500) {
        this.logger.error(message, (exception as Error).stack);
      }
    } else {
      // Catch-all for truly unknown errors (e.g., database connection issues)
      this.logger.error(
        'Caught unknown exception:',
        (exception as Error).stack,
      );

      // For security, keep the message generic for the client
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'A critical server error occurred.';
      errorType = 'INTERNAL_SERVER_ERROR';
    }

    const extensions: Record<string, any> = {
      statusCode: status,
      code: errorType, // Using 'code' is standard in GraphQL extensions
    };

    return new GraphQLError(message, { extensions });
  }
}
