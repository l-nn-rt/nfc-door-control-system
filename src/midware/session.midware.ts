import { SessionInvalidError } from './../model/errors';
import { NextFunction, Request, Response } from 'express';

import { AuthenticationError, errorHandling } from '../model/errors';
import { LanguageService } from '../services/language.service';
import { ERROR_MESSAGES } from '../res/error.messages';

/**
 * Midware to validate the session of an authenticated user.
 *
 * @author Lennart Rak
 * @version 1.0
 */
export class SessionMidware {
    private errorCallback?: (response: Response) => void;

    constructor(errorcallback?: (response: Response) => void) {
        this.errorCallback = errorcallback;
    }

    /**
     * Validates the Session
     * @param request the request object from the API call
     * @param response the response object for the API call
     * @param next next function
     */
    validateSession(request: Request, response: Response, next: NextFunction): Promise<void> {
        return new Promise((resolve) => {
            if (
                request.session &&
                request.session.validUntil &&
                request.session.validUntil > Date.now()
            ) {
                next();
                return resolve();
            }
            if (this.errorCallback) {
                this.errorCallback(response);
                return resolve();
            }
            errorHandling(new SessionInvalidError(), response);
            return resolve();
        });
    }
}
