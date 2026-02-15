import { BadRequestException } from '@nestjs/common';

/**
 * Exception thrown when prompt builder receives invalid input
 */
export class InvalidPromptInputException extends BadRequestException {
    constructor(field: string, reason: string) {
        super({
            statusCode: 400,
            error: 'Invalid Prompt Input',
            message: `Invalid ${field}: ${reason}`,
            field,
            reason,
        });
    }
}

/**
 * Exception thrown when required prompt parameters are missing
 */
export class MissingPromptParameterException extends BadRequestException {
    constructor(parameter: string) {
        super({
            statusCode: 400,
            error: 'Missing Prompt Parameter',
            message: `Required parameter '${parameter}' is missing or invalid`,
            parameter,
        });
    }
}
