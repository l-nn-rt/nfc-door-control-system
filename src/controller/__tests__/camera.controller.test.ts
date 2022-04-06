import {CameraController} from "../camera.controller";
import {Config} from "../../model/config.model";
import {getMockReq, getMockRes} from "@jest-mock/express";

import {VideoQuality, Url} from 'shared-utilities';

let cameraController: CameraController;
const config: Config = require("../../../config/default.json");
let {res, clearMockRes} = getMockRes();
let req = getMockReq();

beforeEach(() => {
    cameraController = new CameraController(config.port);

    clearMockRes();
    req = getMockReq();

});

describe("connect", () => {
    const hostname = "10.10.255"
    test("successfully get HD stream url", async () => {

        await cameraController.connect(getMockReq({query: {quality: VideoQuality.HD}, "hostname": hostname}), res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({url: new Url(`wss://${hostname}:${config.port}/api/stream1`)})
    });
    test("successfully get SD stream url", async () => {

        await cameraController.connect(getMockReq({query: {quality: VideoQuality.SD}, "hostname": hostname}), res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({url: new Url(`wss://${hostname}:${config.port}/api/stream2`)})
    });
});