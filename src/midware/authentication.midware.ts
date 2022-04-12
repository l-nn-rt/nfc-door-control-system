import { InvalidCredentialsError } from '../model/errors';
import { NextFunction, Request, Response } from 'express';
import auth from 'basic-auth';

import { errorHandling } from '../model/errors';
import { LanguageService } from '../services/language.service';
import { DatabaseConnection } from '../controller/database/databaseConnection';
import { DatabaseCredentials } from '../model/database/databaseCredentials';
import { MESSAGES } from '../res/messages';
import { DatabaseFactory } from '../controller/database/databaseFactory';

/**
 * Midware for http basic authentication
 *
 * @author Gregor Peters
 * @version 1.0
 */
export class AuthenticationMidware {
    private readonly databaseFactory: DatabaseFactory;

    constructor(databaseFactory: DatabaseFactory) {
        this.databaseFactory = databaseFactory;
    }

    /**
     * Authenticates a request and creates {@link DatabaseConnection}, stored in response.locals
     *
     * @param request the request object from the API call
     * @param response the response object for the API call
     * @param next Next function.
     */
    public async authenticate(request: Request, response: Response, next: NextFunction) {
        const credentials = auth(request);
        if (!(credentials && credentials.name && credentials.pass)) {
            response.set(
                'WWW-Authenticate',
                'Basic realm="' + LanguageService.getInstance().translate(MESSAGES.LOGIN) + '"'
            );
            return response.sendStatus(401);
        }
        await this.databaseFactory
            .createConnection(new DatabaseCredentials(credentials.name, credentials.pass))
            .then((databaseConnection: DatabaseConnection) => {
                response.locals.databaseConnection = databaseConnection;
                return next();
            })
            .catch((error) => {
                if (error instanceof InvalidCredentialsError) {
                    response.set(
                        'WWW-Authenticate',
                        'Basic realm="' +
                            LanguageService.getInstance().translate(MESSAGES.LOGIN) +
                            '"'
                    );
                    return response.sendStatus(401);
                } else {
                    return errorHandling(error, response);
                }
            });
    }
}
