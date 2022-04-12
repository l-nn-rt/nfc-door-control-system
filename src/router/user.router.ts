import express, { Router } from 'express';
import { ValidationMidware } from '../midware/validation.midware';
import { SessionMidware } from '../midware/session.midware';
import { UserController } from '../controller/user.controller';
import { AuthenticationMidware } from '../midware/authentication.midware';
import { AbstractRouter } from './abstract.router';
import { DatabaseFactory } from '../controller/database/databaseFactory';

/**
 * Setups the router for user
 *
 * @author Lennart Rak
 * @version 1.0
 */
export class UserRouter extends AbstractRouter {
    private readonly _router: express.Router;

    public constructor(userController: UserController, databaseFactory: DatabaseFactory) {
        super();
        //Midware
        const sessionMidware = new SessionMidware();
        const authenticationMidware = new AuthenticationMidware(databaseFactory);
        //Setup Router
        this._router = Router();
        //Login
        this.router.post(
            '/login',
            ValidationMidware.validateUserLogin,
            userController.login.bind(userController)
        );
        //Logout
        this.router.post(
            '/logout',
            sessionMidware.validateSession.bind(sessionMidware),
            userController.logout.bind(userController)
        );
        //Tests if session ist valid
        this.router.get('/login', userController.getUsername.bind(userController));
        //Get nfc token of specific user
        this.router.get(
            '/:identifier/nfc-token',
            authenticationMidware.authenticate.bind(authenticationMidware),
            sessionMidware.validateSession.bind(sessionMidware),
            userController.getNfcToken.bind(userController)
        );
        //Get all usernames
        this.router.get(
            '/',
            sessionMidware.validateSession.bind(sessionMidware),
            userController.getAllUsernames.bind(userController)
        );
        //Set nfc-token of specific user
        this.router.post(
            '/:identifier/nfc-token',
            ValidationMidware.validateNfcToken,
            authenticationMidware.authenticate.bind(authenticationMidware),
            sessionMidware.validateSession.bind(sessionMidware),
            userController.setNfcToken.bind(userController)
        );
        //Delete nfc token of specific user
        this.router.delete(
            '/:identifier/nfc-token',
            authenticationMidware.authenticate.bind(authenticationMidware),
            sessionMidware.validateSession.bind(sessionMidware),
            userController.deleteNfcToken.bind(userController)
        );
    }

    public get router(): express.Router {
        return this._router;
    }
}
