import {UserController} from "../user.controller";
import {Config} from "../../model/config.model";
import express from "express";


const userControllerMock = jest.createMockFromModule(
    '../user.controller'
) as jest.Mocked<UserController>;

const config: Config = require('../../../config/default.json');


const success = jest.fn().mockImplementation((request: express.Request, response: express.Response) => {
    response.status(200).json({});
    return Promise.resolve();
});

userControllerMock.deleteNfcToken = success;
userControllerMock.getAllNfcTokens = success;
userControllerMock.getAllUsernames = success;
userControllerMock.getNfcToken = success;
userControllerMock.getUsername = success;
userControllerMock.loadNfcTokens = success;
userControllerMock.login = jest.fn().mockImplementation((request: express.Request, response: express.Response) => {
    request.session.validUntil = Date.now() + config.sessionMaxAge;
    request.session.username = request.body.username;
    response.status(200).json({});
    return Promise.resolve();
});
userControllerMock.logout = success;
userControllerMock.setNfcToken = success;

export default userControllerMock;
