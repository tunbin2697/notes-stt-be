import { BadRequestException } from '@nestjs/common';

/**
 * Custom exception for business logic violations (e.g., cart limit exceeded).
 * Extends BadRequestException (HTTP 400) to ensure the client receives a
 * meaningful error status without exposing internal server details.
 */
export class BusinessRuleException extends BadRequestException {
  constructor(message: string) {
    // Calls the parent constructor with the user-facing error message
    super(message);

    // Set a custom name for clearer logging and identification in the filter
    this.name = 'BusinessRuleException';
  }
}
