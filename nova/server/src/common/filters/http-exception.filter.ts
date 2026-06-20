import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common'
import { randomUUID } from 'crypto'
import { Response } from 'express'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const requestId = randomUUID()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'An internal error occurred. Please try again later.'
    let validationErrors: string[] | undefined

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const resp = exceptionResponse as Record<string, unknown>
        message = (resp.message as string) || message

        // class-validator returns an array of messages
        if (Array.isArray(resp.message)) {
          validationErrors = resp.message as string[]
          message = 'Validation failed.'
        }
      }
    } else {
      // Log full error server-side only — never leak to client
      this.logger.error(`[${requestId}] Unhandled exception:`, exception)
    }

    response.status(status).json({
      ok: false,
      message,
      ...(validationErrors ? { errors: validationErrors } : {}),
      requestId
    })
  }
}
