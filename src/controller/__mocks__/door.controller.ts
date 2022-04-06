import {DoorController} from '../door.controller';
import express from "express";

const doorControllerMock = jest.createMockFromModule(
    '../door.controller'
) as jest.Mocked<DoorController>;

const success = jest.fn().mockImplementation((request: express.Request, response: express.Response) => {
    response.status(200).json({});
    return Promise.resolve();
});

doorControllerMock.open = success;
doorControllerMock.deleteNfcToken = jest.fn();
doorControllerMock.setDoorMicrocontroller = success;
doorControllerMock.updateDoorControllerViaRequest = success;
doorControllerMock.updateNfcToken = jest.fn();

export default doorControllerMock;