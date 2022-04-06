import {Request, Response} from 'express';

import {VideoQuality, Url} from 'shared-utilities';
import {CameraService} from "../services/camera.service";

/**
 * CameraController controls the camera.
 * A user can get the camera stream through the connect method.
 *
 * @author Gregor Peters, Lennart Rak
 * @version 1.0
 */
export class CameraController {

    private readonly port: number;

    constructor(port: number) {
        this.port = port;
    }

    /**
     * Connect to the web stream
     *
     * @param request the request object from the API call.
     * Requires request.query.quality set as {@link VideoQuality}
     * @param response the response object for the API call
     */
    public async connect(request: Request, response: Response): Promise<void> {
        return new Promise(resolve => {
            const ip = request.hostname;
            let url = `wss://${ip}:${this.port}`;

            const quality: VideoQuality = request.query.quality as VideoQuality;

            switch (quality) {
                case VideoQuality.HD:
                    url += CameraService.HQ_PATH;
                    break;
                case VideoQuality.SD:
                    url += CameraService.LQ_PATH;
                    break;
            }

            const returnValue: Url = new Url(url);

            response.status(200).json({
                url: returnValue
            });
            resolve();
        });

    }
}
