import express from "express";
import {CameraController} from "../camera.controller";

const cameraControllerMock = jest.createMockFromModule(
    '../camera.controller'
) as jest.Mocked<CameraController>;

const success = jest.fn().mockImplementation((request: express.Request, response: express.Response) => {
    response.status(200).json({});
    return Promise.resolve();
});

cameraControllerMock.connect = success;

export default cameraControllerMock;