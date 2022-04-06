import express, {Router} from 'express';
import {CameraController} from '../controller/camera.controller';
import {ValidationMidware} from '../midware/validation.midware';
import {AbstractRouter} from "./abstract.router";

/**
 * Setups the router for camera
 *
 * @author Lennart Rak
 * @version 1.0
 */
export class CameraRouter extends AbstractRouter {
    private readonly _router: express.Router;

    public constructor(cameraController: CameraController) {
        super();
        //Midware
        //Setup Router
        this._router = Router();
        this.router.get(
            '/connection', ValidationMidware.validateQuality,
            cameraController.connect.bind(cameraController)
        );
    }


    public get router(): express.Router {
        return this._router;
    }
}