import {ERROR_MESSAGES} from '../res/error.messages';
import {LanguageService} from './language.service';
import {Url} from 'shared-utilities';
import express from 'express';
import * as https from 'https';
import {WithWebsocketMethod} from 'express-ws';

/**
 * CameraService is the service of our camera. It handles the viewers and sent them the camera stream.
 * @version 1.0
 * @author Gregor Peters, Lennart Rak
 */
export class CameraService {
    private viewer: number;

    private static instance: CameraService;
    private static application: express.Application & WithWebsocketMethod;
    private static server: https.Server;

    private static readonly _HQ_PATH: string = '/api/stream1';
    private static readonly _LQ_PATH: string = '/api/stream2';

    private constructor(
        HQ: Url,
        LQ: Url,
        application: express.Application & WithWebsocketMethod,
        server: https.Server
    ) {
        CameraService.application = application;
        CameraService.server = server;
        this.viewer = 0;
        CameraService.setUpHighQuality(HQ);
        CameraService.setUpLowQuality(LQ);
    }

    private static setUpHighQuality(rtspUrl: Url) {
        const {proxy} = require('rtsp-relay')(this.application, this.server);
        const handler = proxy({
            url: rtspUrl.toString(),
            verbose: true
        });
        this.application.ws(this._HQ_PATH, handler);
    }

    private static setUpLowQuality(rtspUrl: Url) {
        const {proxy} = require('rtsp-relay')(this.application, this.server);
        const handler = proxy({
            url: rtspUrl.toString(),
            verbose: true
        });
        this.application.ws(this._LQ_PATH, handler);
    }

    /**
     * Returns an instance of the CameraService
     * @param HQ the url to the high quality stream
     * @param LQ the url to the low quality stream
     * @param application the express application
     * @param server the https server
     */
    public static getInstance(
        HQ?: Url,
        LQ?: Url,
        application?: express.Application & WithWebsocketMethod,
        server?: https.Server
    ): CameraService {
        if (!this.instance) {
            if (!HQ || !LQ || !application || !server) {
                throw new Error(
                    LanguageService.getInstance().translate(ERROR_MESSAGES.INIT_ARGS_MANDATORY)
                );
            }
            this.instance = new CameraService(HQ, LQ, application, server);
        }
        return this.instance;
    }

    public static get HQ_PATH(): string {
        return this._HQ_PATH;
    }

    public static get LQ_PATH(): string {
        return this._LQ_PATH;
    }
}
