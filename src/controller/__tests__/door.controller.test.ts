import {DoorController} from "../door.controller";
import {Config} from "../../model/config.model"
import databaseFactoryMock from "../../database/__mocks__/databaseFactory";
import {getMockReq, getMockRes} from "@jest-mock/express";
import {DatabaseService} from "../../database/database.service";
import databaseServiceMock from "../../database/__mocks__/database.service.mock";
import {HttpService} from "../../services/http.service";
import httpServiceMock from "../../services/__mocks__/http.service.mock";
import userControllerMock from "../__mocks__/user.controller.mock";
import {User} from "../../model/user.model";
import {UserController} from "../user.controller";
import {Hash} from "shared-utilities";
import {DoorSingleton} from "../../model/doorSingleton.model";

jest.mock('../../services/http.service');


jest.mock('../user.controller');

const userController = UserController as jest.MockedClass<typeof UserController>;
userController.mockImplementation(() => {
    return userControllerMock;
});


const config: Config = require("../../../config/default.json");
let doorController: DoorController;

let req = getMockReq();
let {res, clearMockRes} = getMockRes();

const n = 10;

const user: User[] = [];

for (let i = 0; i < n; i++) {
    user.push(new User(i.toString(), i.toString(), i.toString()));
}

beforeEach(() => {
    DatabaseService.getInstance = jest.fn().mockReturnValue(databaseServiceMock);
    HttpService.getInstance = jest.fn().mockReturnValue(httpServiceMock);


    doorController = new DoorController(config.doorMicrocontroller, databaseFactoryMock);

    clearMockRes();
    req = getMockReq();

    httpServiceMock.delete.mockClear();
    userControllerMock.getNfcToken.mockClear();
});

describe("deleteNfcToken", () => {
    test("success", async () => {
        httpServiceMock.delete.mockResolvedValueOnce({status: 200} as Response);

        await expect(doorController.deleteNfcToken([])).resolves.not.toThrow();
        expect(httpServiceMock.delete).toBeCalledTimes(1);

    });
    test("successfully delete all", async () => {
        httpServiceMock.delete.mockResolvedValueOnce({status: 200} as Response);

        await expect(doorController.deleteNfcToken([], true)).resolves.not.toThrow();
        expect(httpServiceMock.delete).toBeCalledTimes(1);
    });
    test("bad request", async () => {
        httpServiceMock.delete.mockResolvedValue({status: 400} as Response);

        await expect(doorController.deleteNfcToken([], true)).rejects.not.toThrow();

        expect(httpServiceMock.delete).toBeCalledTimes(1);
    });
    test("http service rejects", async () => {
        httpServiceMock.delete.mockRejectedValueOnce({});

        await expect(doorController.deleteNfcToken([], true)).rejects.not.toThrow();

        expect(httpServiceMock.delete).toBeCalledTimes(1);
    });
});
describe("doorSingleton", () => {
    test("expect doorSingleton to be the same as from get instance", () => {
        expect(doorController.doorSingleton).toBe(DoorSingleton.getInstance());
    })
});
describe("open", () => {
    test("success", async () => {
        httpServiceMock.post.mockResolvedValue({status: 200} as Response);

        await doorController.open(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
    });
    test("failure", async () => {
        httpServiceMock.post.mockResolvedValue({status: 400} as Response);

        await doorController.open(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });
    test("unexpected error", async () => {
        httpServiceMock.post.mockRejectedValueOnce(new Error());

        await doorController.open(req, res);
        expect(res.status).toHaveBeenCalledWith(560);
    });
});
describe("seed", () => {
    test("expect seed to be the same as in config", () => {
        expect(doorController.seed).toBe(DoorSingleton.getInstance().microcontroller.seed);
    })
});
describe("setDoorMicrocontroller", () => {
    const newEndpoint = "efe";
    const oldEndpoint = config.doorMicrocontroller.endpoint.value;

    beforeEach(() => {
        DoorSingleton.getInstance().microcontroller.endpoint = oldEndpoint;
    });

    test("success", async () => {
        databaseServiceMock.setDoor.mockResolvedValueOnce();
        await doorController.setDoorMicrocontroller(getMockReq({body: {endpoint: newEndpoint}}), res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(DoorSingleton.getInstance().microcontroller.endpoint).toBe(newEndpoint);
    });

    test("database service rejects", async () => {
        databaseServiceMock.setDoor.mockRejectedValueOnce(new Error());
        await doorController.setDoorMicrocontroller(getMockReq({body: {endpoint: newEndpoint}}), res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(DoorSingleton.getInstance().microcontroller.endpoint).toBe(oldEndpoint);
    });
    test("unexpected error", async () => {
        // @ts-ignore
        databaseServiceMock.setDoor.mockReturnValueOnce(undefined);
        await doorController.setDoorMicrocontroller(getMockReq({body: {endpoint: newEndpoint}}), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(DoorSingleton.getInstance().microcontroller.endpoint).toBe(oldEndpoint);
    });
});

describe("updateDoorControllerViaRequest", () => {
    test("success with matching hashes", async () => {
        const hash: Hash = new Hash("84d89877f0d4041efb6bf91a16f0248f2fd573e6af05c19f96bedb9f882f7882");

        userControllerMock.loadNfcTokens.mockResolvedValueOnce(user.map((u) => {
            return (u.nfcToken ? u.nfcToken : "")
        }));
        httpServiceMock.get.mockResolvedValueOnce({status: 200, body: {"hash": hash}} as unknown as Response);

        await doorController.updateDoorControllerViaRequest(req, res);
        expect(res.status).toHaveBeenCalledWith(200);

        //expect(userControllerMock.getNfcToken).toBeCalledTimes(1);
    });
    test("failure", async () => {

        userControllerMock.loadNfcTokens.mockRejectedValueOnce([]);


        await doorController.updateDoorControllerViaRequest(req, res);
        expect(res.status).toHaveBeenCalledWith(560);
    });
    test("failure2", async () => {

        userControllerMock.loadNfcTokens.mockResolvedValueOnce(user.map((u) => {
            return (u.nfcToken ? u.nfcToken : "")
        }));
        httpServiceMock.get.mockResolvedValueOnce({status: 400} as unknown as Response);

        await doorController.updateDoorControllerViaRequest(req, res);
        expect(res.status).toHaveBeenCalledWith(560);
    });
    test("failure3", async () => {

        userControllerMock.loadNfcTokens.mockResolvedValueOnce(user.map((u) => {
            return (u.nfcToken ? u.nfcToken : "")
        }));
        httpServiceMock.get.mockRejectedValueOnce(new Error());

        await doorController.updateDoorControllerViaRequest(req, res);
        expect(res.status).toHaveBeenCalledWith(560);
    });

    test("success with different hashes", async () => {
        const hash: Hash = new Hash("123");

        userControllerMock.loadNfcTokens.mockResolvedValueOnce(user.map((u) => {
            return (u.nfcToken ? u.nfcToken : "")
        }));
        httpServiceMock.get.mockResolvedValueOnce({status: 200, body: {"hash": hash}} as unknown as Response);

        httpServiceMock.delete.mockResolvedValueOnce({status: 200} as Response);
        httpServiceMock.put.mockResolvedValue({status: 200} as Response);

        await doorController.updateDoorControllerViaRequest(req, res);
        expect(res.status).toHaveBeenCalledWith(200);

    });
    test("failure4", async () => {
        const hash: Hash = new Hash("123");

        userControllerMock.loadNfcTokens.mockResolvedValueOnce(user.map((u) => {
            return (u.nfcToken ? u.nfcToken : "")
        }));
        httpServiceMock.get.mockResolvedValueOnce({status: 200, body: {"hash": hash}} as unknown as Response);

        httpServiceMock.delete.mockResolvedValueOnce({status: 200} as Response);
        httpServiceMock.put.mockResolvedValue({status: 400} as Response);

        await doorController.updateDoorControllerViaRequest(req, res);
        expect(res.status).toHaveBeenCalledWith(560);

    });
    test("failure5", async () => {
        const hash: Hash = new Hash("123");

        userControllerMock.loadNfcTokens.mockResolvedValueOnce(user.map((u) => {
            return (u.nfcToken ? u.nfcToken : "")
        }));
        httpServiceMock.get.mockResolvedValueOnce({status: 200, body: {"hash": hash}} as unknown as Response);

        httpServiceMock.delete.mockResolvedValueOnce({status: 400} as Response);

        await doorController.updateDoorControllerViaRequest(req, res);
        expect(res.status).toHaveBeenCalledWith(560);

    });
});

describe("updateNfcToken", () => {
    test("empty array", async () => {
        await expect(doorController.updateNfcToken([])).rejects.not.toThrow();
    });
    test("replace token", async () => {

        httpServiceMock.put.mockResolvedValueOnce({status: 200} as Response);

        await expect(doorController.updateNfcToken(["123"], "223")).resolves.not.toThrow();
    });
    test("http service rejects", async () => {

        httpServiceMock.put.mockRejectedValueOnce(new Error());

        await expect(doorController.updateNfcToken(["123"], "223")).rejects.not.toThrow();
    });
});

describe("timeoutCallback", () => {
    test("success", async () => {
        jest.useFakeTimers();
        jest.spyOn(global, 'setTimeout').mockClear();
        userControllerMock.loadNfcTokens.mockClear();
        const hash: Hash = new Hash("84d89877f0d4041efb6bf91a16f0248f2fd573e6af05c19f96bedb9f882f7882");

        userControllerMock.loadNfcTokens.mockResolvedValueOnce(user.map((u) => {
            return (u.nfcToken ? u.nfcToken : "")
        }));
        httpServiceMock.get.mockResolvedValueOnce({status: 200, body: {"hash": hash}} as unknown as Response);

        doorController = new DoorController(config.doorMicrocontroller, databaseFactoryMock);

        jest.runAllTimers();

        expect(setTimeout).toBeCalledTimes(1);
        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 24 * 60 * 60 * 1000);

        expect(userControllerMock.loadNfcTokens).toBeCalledTimes(1);

        //expect(setTimeout).toBeCalledTimes(2);

        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 24 * 60 * 60 * 1000);
    });
    test("on failure", async () => {
        jest.useFakeTimers();
        jest.spyOn(global, 'setTimeout').mockClear();
        userControllerMock.loadNfcTokens.mockClear();
        const hash: Hash = new Hash("12");
        userControllerMock.loadNfcTokens.mockResolvedValueOnce(user.map((u) => {
            return (u.nfcToken ? u.nfcToken : "")
        }));
        httpServiceMock.get.mockResolvedValueOnce({status: 400, body: {"hash": hash}} as unknown as Response);

        doorController = new DoorController(config.doorMicrocontroller, databaseFactoryMock);

        jest.runAllTimers();

        expect(setTimeout).toBeCalledTimes(1);
        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 24 * 60 * 60 * 1000);

        //expect(userControllerMock.loadNfcTokens).toBeCalledTimes(1);

        //expect(setTimeout).toBeCalledTimes(2);

        //expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 500000);
    });

});

