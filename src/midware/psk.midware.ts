import { Request, Response } from 'express';

import { AuthenticationError, errorHandling } from '../model/errors';
import { LanguageService } from '../services/language.service';
import { ERROR_MESSAGES } from '../res/error.messages';
import { DoorSingleton } from '../model/doorSingleton.model';
import { DatabaseFactory } from '../controller/database/databaseFactory';

/**
 * Midware to validate the pre shared key (psk) of the {@link DoorSingleton}.
 *
 * @author Lennart Rak, Gregor Peters
 * @version 1.0
 */
export class PskMidware {
    private readonly doorSingleton: DoorSingleton;
    private readonly databaseFactory: DatabaseFactory;

    constructor(databaseFactory: DatabaseFactory) {
        this.doorSingleton = DoorSingleton.getInstance();
        this.databaseFactory = databaseFactory;
    }

    /**
     * Validates the PSK
     *
     * @param request the request object from the API call
     * @param response the response object for the API call
     * @param next next function
     */
    async validatePSK(request: Request, response: Response, next: any) {
        if (request.headers.psk) {
            if (this.doorSingleton.microcontroller.psk == request.headers.psk) {
                await this.databaseFactory
                    .createMidwareConnection()
                    .then((connection) => {
                        response.locals.databaseConnection = connection;
                        next();
                    })
                    .catch((error) => {
                        errorHandling(error, response);
                    });
            } else {
                errorHandling(
                    new AuthenticationError(
                        LanguageService.getInstance().translate(ERROR_MESSAGES.PSK_INVALID)
                    ),
                    response
                );
            }
        } else {
            errorHandling(
                new AuthenticationError(
                    LanguageService.getInstance().translate(ERROR_MESSAGES.PSK_MISSING)
                ),
                response
            );
        }
    }
}
