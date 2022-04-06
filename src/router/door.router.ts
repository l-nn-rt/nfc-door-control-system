import express, {Router} from 'express';
import {ValidationMidware} from '../midware/validation.midware';
import {PskMidware} from '../midware/psk.midware';
import {DoorController} from '../controller/door.controller';
import {SessionMidware} from '../midware/session.midware';
import {AbstractRouter} from './abstract.router';
import {DatabaseFactory} from '../database/databaseFactory';

/**
 * Setups the router for door
 *
 * @author Lennart Rak
 * @version 1.0
 */
export class DoorRouter extends AbstractRouter {
    private readonly _router: express.Router;

    public constructor(doorController: DoorController, databaseFactory: DatabaseFactory) {
        super();
        //Midware
        const pskMidware = new PskMidware(databaseFactory);
        const sessionMidware = new SessionMidware();
        //Setup Router
        this._router = Router();
        this.router.post(
            '/open',
            sessionMidware.validateSession.bind(sessionMidware),
            doorController.open.bind(doorController)
        );
        this.router.post(
            '/register',
            ValidationMidware.validateDoorLogin,
            pskMidware.validatePSK.bind(pskMidware),
            doorController.setDoorMicrocontroller.bind(doorController)
        );
        this.router.post(
            '/refresh',
            sessionMidware.validateSession.bind(sessionMidware),
            doorController.updateDoorControllerViaRequest.bind(doorController)
        );
    }

    public get router(): express.Router {
        return this._router;
    }
}
