import { NotificationController } from '../notification.controller';
import express from "express";

const notificationControllerMock = jest.createMockFromModule(
    '../notification.controller'
) as jest.Mocked<NotificationController>;


const success = jest.fn().mockImplementation((request: express.Request, response: express.Response) => {
    response.status(200).json({});
    return Promise.resolve();
});

notificationControllerMock.subscribe = success;
notificationControllerMock.sendNotification = jest.fn();

export default notificationControllerMock;
