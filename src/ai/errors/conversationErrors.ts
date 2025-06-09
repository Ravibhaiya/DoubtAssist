
/**
 * @fileOverview Custom error classes for conversation flows.
 */

export class ConversationFlowError extends Error {
  constructor(message: string, public readonly code: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'ConversationFlowError';
  }
}

export class ValidationError extends ConversationFlowError {
  constructor(message: string, originalError?: Error) {
    super(message, 'VALIDATION_ERROR', originalError);
  }
}

export class AIResponseError extends ConversationFlowError {
  constructor(message: string, originalError?: Error) {
    super(message, 'AI_RESPONSE_ERROR', originalError);
  }
}
