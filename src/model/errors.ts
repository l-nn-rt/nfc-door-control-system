import { Response } from 'express';

import { ERROR_MESSAGES } from '../res/error.messages';
import { LanguageService } from '../services/language.service';

/**
 * An error with a response code and a message
 *
 * @author Lennart Rak
 * @author Gregor Peters
 * @version 1.0
 */
export abstract class ResponseError extends Error {
    private readonly _statusCode: number;
    private _responseBody?: object;
    protected constructor(message: string, statusCode: number, responseBody?: object) {
        super(message);
        this._statusCode = statusCode;
        this._responseBody = responseBody;
    }

    public get statusCode(): number {
        return this._statusCode;
    }

    public get responseBody(): object | undefined {
        return this._responseBody;
    }
}

/**
 * An unknown error.
 */
export class UnknownError extends ResponseError {
    constructor() {
        super(LanguageService.getInstance().translate(ERROR_MESSAGES.UNKNOWN), 400);
    }
}

/**
 * An error for invalid credentials.
 */
export class InvalidCredentialsError extends ResponseError {
    constructor() {
        super(
            LanguageService.getInstance().translate(ERROR_MESSAGES.INVALID_LOGIN_CREDENTIALS),
            470
        );
    }
}

/**
 *
 * @bug magic string
 * @todo remove magic string and missing javadoc
 */

export class AlreadyExistsError extends ResponseError {
    constructor() {
        super('Entry with this identifier already exists', 482);
    }
}

/**
 * An error for unauthorized access.
 */
export class AuthenticationError extends ResponseError {
    constructor(message: string) {
        super(message, 486);
    }
}

export class SessionInvalidError extends ResponseError {
    constructor() {
        super(LanguageService.getInstance().translate(ERROR_MESSAGES.SESSION_INVALID), 485);
    }
}

/**
 * An error for missing input.
 */
export class MissingInput extends ResponseError {
    constructor(message: string) {
        super(message, 490);
    }
}

/**
 * An error if a searched entry was not found.
 */
export class EntryNotFound extends ResponseError {
    constructor() {
        super(LanguageService.getInstance().translate(ERROR_MESSAGES.ENTRY_NOT_FOUND), 491);
    }
}

/**
 * An error for anything terrible.
 */
export class InternalServerError extends ResponseError {
    constructor(message?: string) {
        if (message) {
            super(message, 500);
        } else {
            super(
                LanguageService.getInstance().translate(ERROR_MESSAGES.INTERNAL_SERVER_ERROR),
                500
            );
        }
    }
}

/**
 * An error, if the database can't be reached.
 */
export class ReachDatabaseError extends ResponseError {
    constructor(msg?: string) {
        super(
            LanguageService.getInstance().translate(ERROR_MESSAGES.REACH_DATABASE) + msg
                ? ` ${LanguageService.getInstance().translate(
                      ERROR_MESSAGES.DATABASE_ERROR_MESSAGE
                  )}:` + msg
                : '',
            562
        );
    }
}

/**
 * An error, if the door couldn't be reached.
 */
export class DoorConnectError extends ResponseError {
    constructor(body?: object) {
        super(LanguageService.getInstance().translate(ERROR_MESSAGES.DOOR_REACH), 560, body);
    }
}

/**
 * A function for custom error handling.
 * @param error Error to handle.
 * @param response {@link Response} to which error should be sent.
 */
export function errorHandling(error: any, response: Response) {
    let message: string = LanguageService.getInstance().translate(ERROR_MESSAGES.UNKNOWN);
    let code: number = 400;

    if (error instanceof Error) {
        message = error.message;
        if (error instanceof ResponseError) {
            code = error.statusCode;
            if (error.responseBody) {
                return response.status(code).json(error.responseBody);
            }
        } else {
            code = 400;
        }
    }

    response.status(code).json({
        error: {
            message: message
        }
    });
}
