import {Config} from "../../model/config.model";
import express from "express";
import {EventController} from "../event.controller";


const eventControllerMock = jest.createMockFromModule(
    '../event.controller'
) as jest.Mocked<EventController>;

const success = jest.fn().mockImplementation((request: express.Request, response: express.Response) => {
    response.status(200).json({});
    return Promise.resolve();
});

eventControllerMock.addEventSubscriber = success;
eventControllerMock.deleteEventSubscriber = success;
eventControllerMock.getAll = success;
eventControllerMock.notify = success;

export default eventControllerMock;
