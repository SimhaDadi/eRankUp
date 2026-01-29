import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger('AllExceptionsFilter');

    constructor(private readonly httpAdapterHost: HttpAdapterHost) { }

    catch(exception: unknown, host: ArgumentsHost): void {
        // In certain situations `httpAdapter` might not be available in the
        // constructor method, thus we should resolve it here.
        const { httpAdapter } = this.httpAdapterHost;

        const ctx = host.switchToHttp();

        const httpStatus =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const response = ctx.getResponse();
        const req = ctx.getRequest();
        const url = req.url;
        const method = req.method;

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const exceptionResponse = exception instanceof HttpException
            ? exception.getResponse()
            : { message: (exception as any).message };

        const message = typeof exceptionResponse === 'object' && (exceptionResponse as any).message
            ? (exceptionResponse as any).message
            : exceptionResponse;

        const responseBody = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: url,
            message: message,
        };

        const fs = require('fs');
        const path = require('path');
        const logDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir);
        }
        const logFile = path.join(logDir, 'debug.log');
        const logMsg = `[${new Date().toISOString()}] ${method} ${url} - ${status}: ${JSON.stringify(message)}\n`;

        if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
            this.logger.error(
                `[${method}] ${url} - Error: ${JSON.stringify(message)}`,
                (exception as Error).stack,
            );
            try {
                fs.appendFileSync(logFile, logMsg + `${(exception as Error).stack}\n`);
            } catch (e) {
                console.error('Failed to write to log file', e);
            }
        } else {
            this.logger.warn(`[${method}] ${url} - Warning: ${JSON.stringify(message)}`);
            try {
                fs.appendFileSync(logFile, logMsg);
            } catch (e) {
                console.error('Failed to write to log file', e);
            }
        }

        httpAdapter.reply(response, responseBody, status);
    }
}
