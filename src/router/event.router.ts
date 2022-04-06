import express, { Router } from 'express';
import { ValidationMidware } from '../midware/validation.midware';
import { SessionMidware } from '../midware/session.midware';
import { EventController } from '../controller/event.controller';
import { AuthenticationMidware } from '../midware/authentication.midware';
import { AbstractRouter } from './abstract.router';
import { DatabaseFactory } from '../database/databaseFactory';

/**
 * Setups the router for event
 *
 * @author Lennart Rak
 * @version 1.0
 */
export class EventRouter extends AbstractRouter {
    private readonly _router: express.Router;

    public constructor(eventController: EventController, databaseFactory: DatabaseFactory) {
        super();
        //Midware
        const sessionMidware = new SessionMidware();
        const authenticationMidware = new AuthenticationMidware(databaseFactory);
        //Setup Router
        this._router = Router();
        this.router.post(
            '/',
            ValidationMidware.validateEvent,
            eventController.notify.bind(eventController)
        );
        this.router.post(
            '/subscribers',
            authenticationMidware.authenticate.bind(authenticationMidware),
            ValidationMidware.validateEventSubscriber,
            ValidationMidware.validateEvent,
            sessionMidware.validateSession.bind(sessionMidware),
            eventController.addEventSubscriber.bind(eventController)
        );
        this.router.get(
            '/subscribers',
            sessionMidware.validateSession.bind(sessionMidware),
            eventController.getAll.bind(eventController)
        );
        this.router.delete(
            '/subscribers',
            authenticationMidware.authenticate.bind(authenticationMidware),
            ValidationMidware.validateEventSubscriber,
            sessionMidware.validateSession.bind(sessionMidware),
            eventController.deleteEventSubscriber.bind(eventController)
        );
    }

    public get router(): express.Router {
        return this._router;
    }
}
