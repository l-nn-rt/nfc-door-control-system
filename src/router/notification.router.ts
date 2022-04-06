import express, {Router} from "express";
import {NotificationController} from "../controller/notification.controller";
import {AbstractRouter} from "./abstract.router";
import {ValidationMidware} from "../midware/validation.midware";

/**
 * Setups the router for notification
 *
 * @author Lennart Rak
 * @version 1.0
 */
export class NotificationRouter extends AbstractRouter {
    private readonly _router: express.Router;

    public constructor(notificationController: NotificationController) {
        super();
        //Midware
        //Setup Router
        this._router = Router();
        this.router.post('/push/subscription', ValidationMidware.validateSubscription,
            notificationController.subscribe.bind(notificationController));
    }

    public get router(): express.Router {
        return this._router;
    }
}