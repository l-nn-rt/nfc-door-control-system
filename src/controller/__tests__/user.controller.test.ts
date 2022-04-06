import {UserController} from "../user.controller";
import doorControllerMock from "../__mocks__/door.controller";
import databaseFactoryMock from "../../database/__mocks__/databaseFactory";
import {getMockReq, getMockRes} from "@jest-mock/express";
import databaseConnectionMock from "../../database/__mocks__/databaseConnection";
import {DoorConnectError, errorHandling, ReachDatabaseError} from "../../model/errors";
import sessionMidwareMock from "../../midware/__mocks__/session.midware.mock";
import {NextFunction, Request, Response} from "express";
import {SessionMidware} from "../../midware/session.midware";
import databaseServiceMock from "../../database/__mocks__/database.service.mock";
import {User} from "../../model/user.model";
import {DatabaseService} from "../../database/database.service";
import {DoorController} from "../door.controller";


jest.mock('../../database/database.service');
jest.mock('../../midware/session.midware');

let errorC: ((response: Response) => void) | undefined;

const sessionMidware = SessionMidware as jest.MockedClass<typeof SessionMidware>;
sessionMidware.mockImplementation((errorCallback?: (response: Response) => void) => {
    errorC = errorCallback;
    return sessionMidwareMock;
});


let userController: UserController;

let {res, clearMockRes} = getMockRes();
let req = getMockReq();

const sessionMaxAge = 2000000;

const users: User[] = [];

const n = 10;

beforeAll(() => {
    for (let i = 0; i < n; i++) {
        users.push(new User(i.toString(), i.toString(), i.toString()));
    }
    Object.defineProperty(doorControllerMock, 'seed', {
        get: jest.fn(() => '1234'),
    });
});

beforeEach(() => {
    userController = new UserController(doorControllerMock, sessionMaxAge, databaseFactoryMock);

    req = getMockReq();
    clearMockRes();

    databaseFactoryMock.createMidwareConnection.mockClear();
    databaseServiceMock.getAllUserNames.mockClear();
    databaseServiceMock.getAllNfcTokens.mockClear();
    databaseServiceMock.getNfcToken.mockClear();
    databaseServiceMock.setNfcToken.mockClear();


    DatabaseService.getInstance = jest.fn().mockReturnValue(databaseServiceMock);
});

describe("deleteNfcToken", () => {
    test("success", async () => {
        //@ts-ignore
        databaseServiceMock.getAllNfcTokens.mockResolvedValue(users.map((user) => {
            return user.nfcToken;
        }));
        await userController.loadNfcTokens();

        databaseServiceMock.getNfcToken.mockResolvedValue(users[5].nfcToken);
        databaseServiceMock.setNfcToken.mockResolvedValue();
        doorControllerMock.deleteNfcToken.mockResolvedValue();

        await userController.deleteNfcToken(getMockReq({body: {identifier: "5"}}), res);

        expect(res.status).toHaveBeenCalledWith(200);
    });
    test("success with door controller failed", async () => {
        databaseServiceMock.getNfcToken.mockResolvedValue(users[5].nfcToken);
        databaseServiceMock.setNfcToken.mockResolvedValue();
        doorControllerMock.deleteNfcToken.mockRejectedValue(new Error());
        const req=getMockReq({body: {identifier: "5"}})
        await userController.deleteNfcToken(req, res);
        
        expect(res.status).toHaveBeenCalledWith(560);
    });
    test("set the nfc token failed", async () => {
        databaseServiceMock.getNfcToken.mockResolvedValue(users[5].nfcToken);
        databaseServiceMock.setNfcToken.mockRejectedValue(new Error());

        await userController.deleteNfcToken(getMockReq({body: {identifier: "5"}}), res);

        expect(res.status).toHaveBeenCalledWith(400);
    });
    test("get the nfc token failed", async () => {
        databaseServiceMock.getNfcToken.mockRejectedValue(new Error());

        await userController.deleteNfcToken(getMockReq({body: {identifier: "5"}}), res);

        expect(res.status).toHaveBeenCalledWith(400);
    });
    test("unexpected error", async () => {
        // @ts-ignore
        databaseServiceMock.getNfcToken.mockReturnValueOnce(undefined);

        await userController.deleteNfcToken(getMockReq({body: {identifier: "5"}}), res);

        expect(res.status).toHaveBeenCalledWith(400);
    });
});
describe("getAllUsernames", () => {
    test("success", async () => {
        // @ts-ignore
        databaseServiceMock.getAllUserNames.mockResolvedValue(users.map((user) => {
            return user.username;
        }));

        await userController.getAllUsernames(req, res);

        expect(databaseFactoryMock.createMidwareConnection).toBeCalledTimes(1);

        expect(databaseServiceMock.getAllUserNames).toBeCalledTimes(1);

        expect(res.status).toHaveBeenCalledWith(200);
        const expectedReturnValue = {
            "usernames": users.map(user => {
                return user.username
            })
        }
        expect(res.json).toHaveBeenCalledWith(expectedReturnValue);

    });
    /* // This test would fail due to removed caching 
    test("success after usernames are gotten from database", async () => {
        // @ts-ignore
        databaseServiceMock.getAllUserNames.mockResolvedValue(users.map((user) => {
            return user.username;
        }));

        await userController.getAllUsernames(req, res);

        expect(databaseFactoryMock.createMidwareConnection).toBeCalledTimes(1);

        expect(databaseServiceMock.getAllUserNames).toBeCalledTimes(1);

        expect(res.status).toHaveBeenCalledWith(200);
        const expectedReturnValue = {
            "usernames": users.map(user => {
                return user.username
            })
        }
        expect(res.json).toHaveBeenCalledWith(expectedReturnValue);

        await userController.getAllUsernames(req, res);

        expect(databaseFactoryMock.createMidwareConnection).toBeCalledTimes(1);

        expect(databaseServiceMock.getAllUserNames).toBeCalledTimes(1);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expectedReturnValue);

    });
*/
    test("database not reachable", async () => {

        const errorMessage = "test error";

        databaseFactoryMock.createMidwareConnection.mockRejectedValueOnce(new Error(errorMessage));

        await userController.getAllUsernames(req, res);

        expect(databaseFactoryMock.createMidwareConnection).toBeCalledTimes(1);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: {
                message: errorMessage
            }
        });
    });

    test("get all usernames rejects", async () => {
        databaseServiceMock.getAllUserNames.mockRejectedValueOnce(new Error());

        await userController.getAllUsernames(req, res);

        expect(databaseFactoryMock.createMidwareConnection).toBeCalledTimes(1);

        expect(databaseServiceMock.getAllUserNames).toBeCalledTimes(1);

        expect(res.status).toHaveBeenCalledWith(500);
    });
    test("unexpected error", async () => {
        // @ts-ignore
        databaseServiceMock.getAllUserNames.mockReturnValueOnce(undefined);

        await userController.getAllUsernames(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });
});
describe("loadNfcTokens", () => {
    test("success", async () => {
        // @ts-ignore
        databaseServiceMock.getAllNfcTokens.mockResolvedValue(users.map((user) => {
            return user.nfcToken;
        }));

        const returnValue = await userController.loadNfcTokens();

        expect(databaseFactoryMock.createMidwareConnection).toBeCalledTimes(1);

        expect(databaseServiceMock.getAllNfcTokens).toBeCalledTimes(1);

        const expectedReturnValue = users.map(user => {
            return user.nfcToken
        });
        expect(returnValue).toMatchObject(expectedReturnValue);

    });

    test("success after nfc tokens are gotten from database", async () => {
        // @ts-ignore
        databaseServiceMock.getAllNfcTokens.mockResolvedValue(users.map((user) => {
            return user.nfcToken;
        }));

        const returnValue = await userController.loadNfcTokens();

        expect(databaseFactoryMock.createMidwareConnection).toBeCalledTimes(1);

        expect(databaseServiceMock.getAllNfcTokens).toBeCalledTimes(1);

        const expectedReturnValue = users.map(user => {
            return user.nfcToken
        });
        expect(returnValue).toMatchObject(expectedReturnValue);

        const returnValue2 = await userController.loadNfcTokens();

        expect(databaseFactoryMock.createMidwareConnection).toBeCalledTimes(1);

        expect(databaseServiceMock.getAllNfcTokens).toBeCalledTimes(1);

        expect(returnValue2).toMatchObject(expectedReturnValue);

    });

    test("database not reachable", async () => {

        const errorMessage = "test error";

        databaseFactoryMock.createMidwareConnection.mockRejectedValueOnce(new Error(errorMessage));

        await expect(userController.loadNfcTokens()).rejects.toThrow();

        expect(databaseFactoryMock.createMidwareConnection).toBeCalledTimes(1);

    });

    test("get all nfc tokens rejects", async () => {
        databaseServiceMock.getAllNfcTokens.mockRejectedValueOnce(new Error());

        await expect(userController.loadNfcTokens()).rejects.toThrow();

        expect(databaseFactoryMock.createMidwareConnection).toBeCalledTimes(1);

        expect(databaseServiceMock.getAllNfcTokens).toBeCalledTimes(1);

    });

    test("unexpected error", async () => {
        // @ts-ignore
        databaseServiceMock.getAllNfcTokens.mockReturnValueOnce(undefined);

        await expect(userController.loadNfcTokens()).rejects.not.toThrow();
    });
});
describe("setNfcToken", () => {
    beforeAll(() => {
        jest.spyOn(DoorController.prototype, "seed", "get").mockReturnValue("1234");

    });

    test("success", async () => {
        //@ts-ignore
        databaseServiceMock.getAllNfcTokens.mockResolvedValue(users.map((user) => {
            return user.nfcToken;
        }));
        await userController.loadNfcTokens();

        databaseServiceMock.getNfcToken.mockResolvedValue(users[5].nfcToken);
        databaseServiceMock.setNfcToken.mockResolvedValue();
        doorControllerMock.updateNfcToken.mockResolvedValue();

        await userController.setNfcToken(getMockReq({body: {identifier: "5", nfcToken: "12"}}), res);

        expect(res.status).toHaveBeenCalledWith(200);
    });
    test("success but nfc token is not known", async () => {
        databaseServiceMock.getNfcToken.mockResolvedValue(undefined);
        databaseServiceMock.setNfcToken.mockResolvedValue();
        doorControllerMock.updateNfcToken.mockResolvedValue();

        await userController.setNfcToken(getMockReq({body: {identifier: "5", nfcToken: "12"}}), res);

        expect(res.status).toHaveBeenCalledWith(200);
    });
    test("failure with door controller failed", async () => {
        databaseServiceMock.getNfcToken.mockResolvedValue(users[5].nfcToken);
        databaseServiceMock.setNfcToken.mockResolvedValue();
        doorControllerMock.updateNfcToken.mockRejectedValue(new Error());

        await userController.setNfcToken(getMockReq({body: {identifier: "5", nfcToken: "12"}}), res);

        expect(res.status).toHaveBeenCalledWith(560);
    });
    test("set the nfc token failed", async () => {
        databaseServiceMock.getNfcToken.mockResolvedValue(users[5].nfcToken);
        databaseServiceMock.setNfcToken.mockRejectedValue(new Error());

        await userController.setNfcToken(getMockReq({body: {identifier: "5", nfcToken: "12"}}), res);

        expect(res.status).toHaveBeenCalledWith(400);
    });
    test("get the nfc token failed", async () => {
        databaseServiceMock.getNfcToken.mockRejectedValue(new Error());

        await userController.setNfcToken(getMockReq({body: {identifier: "5", nfcToken: "12"}}), res);

        expect(res.status).toHaveBeenCalledWith(400);
    });
    test("unexpected error", async () => {
        // @ts-ignore
        databaseServiceMock.getNfcToken.mockReturnValueOnce(undefined);

        await userController.setNfcToken(getMockReq({body: {identifier: "5", nfcToken: "12"}}), res);

        expect(res.status).toHaveBeenCalledWith(400);
    });
});
describe("getAllNfcTokens", () => {
    test("success", async () => {
        // @ts-ignore
        databaseServiceMock.getAllNfcTokens.mockResolvedValue(users.map((user) => {
            return user.nfcToken;
        }));

        await userController.getAllNfcTokens(req, res);

        expect(databaseFactoryMock.createMidwareConnection).toBeCalledTimes(1);

        expect(databaseServiceMock.getAllNfcTokens).toBeCalledTimes(1);

        expect(res.status).toHaveBeenCalledWith(200);
        const expectedReturnValue = {
            "nfcTokens": users.map(user => {
                return user.nfcToken
            })
        }
        expect(res.json).toHaveBeenCalledWith(expectedReturnValue);

    });

    test("success after nfc tokens are gotten from database", async () => {
        // @ts-ignore
        databaseServiceMock.getAllNfcTokens.mockResolvedValue(users.map((user) => {
            return user.nfcToken;
        }));

        await userController.getAllNfcTokens(req, res);

        expect(databaseFactoryMock.createMidwareConnection).toBeCalledTimes(1);

        expect(databaseServiceMock.getAllNfcTokens).toBeCalledTimes(1);

        expect(res.status).toHaveBeenCalledWith(200);
        const expectedReturnValue = {
            "nfcTokens": users.map(user => {
                return user.nfcToken
            })
        }
        expect(res.json).toHaveBeenCalledWith(expectedReturnValue);

        await userController.getAllNfcTokens(req, res);

        expect(databaseFactoryMock.createMidwareConnection).toBeCalledTimes(1);

        expect(databaseServiceMock.getAllNfcTokens).toBeCalledTimes(1);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expectedReturnValue);

    });

    test("database not reachable", async () => {

        const errorMessage = "test error";

        databaseFactoryMock.createMidwareConnection.mockRejectedValueOnce(new Error(errorMessage));

        await userController.getAllNfcTokens(req, res);

        expect(databaseFactoryMock.createMidwareConnection).toBeCalledTimes(1);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: {
                message: errorMessage
            }
        });
    });

    test("get nfc tokens rejects", async () => {
        databaseServiceMock.getAllNfcTokens.mockRejectedValueOnce(new Error());

        await userController.getAllNfcTokens(req, res);

        expect(databaseFactoryMock.createMidwareConnection).toBeCalledTimes(1);

        expect(databaseServiceMock.getAllNfcTokens).toBeCalledTimes(1);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    test("unexpected error", async () => {
        // @ts-ignore
        databaseServiceMock.getAllNfcTokens.mockReturnValueOnce(undefined);

        await userController.getAllNfcTokens(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });
});
describe("logout", () => {
    test("success", async () => {
        const username = "test";
        const request = getMockReq({
            body: {"username": username, password: "test12300"},
            session: {validUntil: "5000000", "username": username}
        });

        await userController.logout(request, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(request.session.validUntil).toBe(0);
    });
    test("session not defined", async () => {
        const username = "test";
        const request = getMockReq({
            body: {"username": username, password: "test12300"},
        });

        await userController.logout(request, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });
});
describe("getUsername", () => {
    test("session is valid", async () => {
        sessionMidwareMock.validateSession.mockImplementationOnce((request: Request, response: Response, next: NextFunction) => {
            next();
            return Promise.resolve();
        });

        const username = "test";
        const request = getMockReq({
            body: {"username": username, password: "test12300"},
            session: {validUntil: "", "username": username}
        });

        await userController.getUsername(request, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({"username": username});
    });
    test("session is invalid", async () => {
        sessionMidwareMock.validateSession.mockImplementationOnce((request: Request, response: Response, next: NextFunction) => {
            if (errorC)
                errorC(response);
            return Promise.resolve();
        });

        const username = "test";
        const request = getMockReq({
            body: {"username": username, password: "test12300"},
            session: {validUntil: "", "username": username}
        });

        await userController.getUsername(request, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({});
    });
});
describe("getNfcToken", () => {
    test("success", async () => {
        databaseServiceMock.getNfcToken.mockResolvedValue(users[4].nfcToken);

        await userController.getNfcToken(getMockReq({body: {identifier: users[4].identifier}}), res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({nfcToken: users[4].nfcToken});
    });
    test("get nfc token rejects", async () => {
        databaseServiceMock.getNfcToken.mockRejectedValue(new Error());

        await userController.getNfcToken(getMockReq({body: {identifier: users[4].identifier}}), res);

        expect(res.status).toHaveBeenCalledWith(400);
    });
    test("unexpected database error", async () => {
        // @ts-ignore
        databaseServiceMock.getNfcToken.mockReturnValueOnce(undefined);

        await userController.getNfcToken(getMockReq({body: {identifier: users[4].identifier}}), res);

        expect(res.status).toHaveBeenCalledWith(400);
    });
});
describe("login", () => {
    test("success", async () => {
        databaseFactoryMock.createConnection.mockResolvedValue(databaseConnectionMock);
        const username = "test";
        const request = getMockReq({
            body: {"username": username, password: "test12300"},
            session: {validUntil: "", username: ""}
        });
        await userController.login(request, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(request.session.username).toBe(username);
        expect(request.session.validUntil).toBeLessThanOrEqual(Date.now() + sessionMaxAge);
    });
    test("invalid credentials", async () => {
        // @ts-ignore
        databaseFactoryMock.createConnection.mockResolvedValue(undefined);
        const username = "test";
        const request = getMockReq({
            body: {"username": username, password: "test12300"},
            session: {validUntil: "", username: ""}
        });
        await userController.login(request, res);

        expect(res.status).toHaveBeenCalledWith(470);
    });
    test("cannot reach database", async () => {
        // @ts-ignore
        databaseFactoryMock.createConnection.mockRejectedValue(new ReachDatabaseError());
        const username = "test";
        const request = getMockReq({
            body: {"username": username, password: "test12300"},
            session: {validUntil: "", username: ""}
        });
        await userController.login(request, res);

        expect(res.status).toHaveBeenCalledWith(562);
    });
});