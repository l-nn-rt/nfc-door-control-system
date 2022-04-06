import request from "supertest"
import express from "express";
import {UserRouter} from "../user.router";
import userControllerMock from "../../controller/__mocks__/user.controller.mock";
import databaseFactoryMock from "../../database/__mocks__/databaseFactory";
import sessions from "express-session";
import {EventRouter} from "../event.router";
import eventControllerMock from "../../controller/__mocks__/event.controller.mock";
import {DoorRouter} from "../door.router";
import doorControllerMock from "../../controller/__mocks__/door.controller";
import {DoorSingleton} from "../../model/doorSingleton.model";
import doorSingletonMock from "../../model/__mocks__/doorSingleton.mock";
import {CameraRouter} from "../camera.router";
import cameraControllerMock from "../../controller/__mocks__/camera.controller.mock";
import {NotificationRouter} from "../notification.router";
import notificationControllerMock from "../../controller/__mocks__/notification.controller";

jest.mock('../../model/doorSingleton.model');

const app: express.Application = express();

const userRouter = new UserRouter(userControllerMock, databaseFactoryMock);
const userPath = "/users";

const eventRouter = new EventRouter(eventControllerMock, databaseFactoryMock);
const eventPath = "/event";

let doorRouter: DoorRouter;
const doorPath = "/door";
const psk: number = 1234;

const cameraRouter = new CameraRouter(cameraControllerMock);
const cameraPath = "/camera";

const notificationRouter = new NotificationRouter(notificationControllerMock);
const notificationPath = "/notification";

declare module 'express-session' {
    export interface SessionData {
        validUntil: number;
        username: string;
    }
}

beforeAll(() => {

    DoorSingleton.getInstance = jest.fn().mockReturnValue(doorSingletonMock);
    //@ts-ignore
    doorSingletonMock.microcontroller.psk = psk;

    doorRouter = new DoorRouter(doorControllerMock, databaseFactoryMock);


    app.use(express.json());
    app.use(express.urlencoded({extended: true}));
    app.use(
        sessions({
            secret: 'this needs to be randomly generated',
            saveUninitialized: true,
            resave: false
        }));
    app.use(userPath, userRouter.router);
});


describe("users", () => {
    let cookie: any;

    beforeAll(async () => {

        await request(app)
            .post(userPath + '/login/')
            .send({username: "cn=developer,ou=Users,dc=shihadeh,dc=intern", password: "developer_pass"})
            .expect(200)
            .then(response => {
                const cookies = response.headers['set-cookie'][0].split(',').map((item: string) => item.split(';')[0]);
                cookie = cookies.join(';');
            });
    });

    test("get all usernames", async () => {
        await request(app)
            .get(userPath + '/')
            .set('Cookie', cookie)
            .expect(200);

        expect(userControllerMock.getAllUsernames).toHaveBeenCalledTimes(1);
    });
    test("get user nfc tokens", async () => {
        await request(app)
            .get(userPath + '/username/nfc-token')
            .set('Cookie', cookie)
            .auth("username", "password")
            .expect(200);

        expect(userControllerMock.getNfcToken).toHaveBeenCalled();
    });
    test("get username", async () => {
        await request(app)
            .get(userPath + '/login')
            .set('Cookie', cookie)
            .expect(200);

        expect(userControllerMock.getUsername).toHaveBeenCalled();
    });
    test("set nfc token", async () => {
        await request(app)
            .post(userPath + '/username/nfc-token')
            .send({nfcToken: "1234"})
            .set('Cookie', cookie)
            .auth("username", "password")
            .expect(200);

        expect(userControllerMock.setNfcToken).toHaveBeenCalled();
    });
    test("delete nfcToken", async () => {
        await request(app)
            .delete(userPath + '/username/nfc-token')
            .set('Cookie', cookie)
            .auth("username", "password")
            .expect(200);

        expect(userControllerMock.deleteNfcToken).toHaveBeenCalled();
    });

    afterAll(async () => {
        await request(app)
            .post(userPath + '/logout')
            .set('Cookie', cookie)
            .expect(200);
    });
});

describe("event", () => {
    let cookie: any;

    beforeAll(async () => {

        app.use(eventPath, eventRouter.router);

        await request(app)
            .post(userPath + '/login/')
            .send({username: "cn=developer,ou=Users,dc=shihadeh,dc=intern", password: "developer_pass"})
            .expect(200)
            .then(response => {
                const cookies = response.headers['set-cookie'][0].split(',').map((item: string) => item.split(';')[0]);
                cookie = cookies.join(';');
            });
    });

    test("add event subscriber", async () => {
        await request(app)
            .post(eventPath + '/subscribers')
            .send({endpoint: "123", type: "BELL_RUNG", label: "test"})
            .set('Cookie', cookie)
            .auth("username", "password")
            .expect(200);

        expect(eventControllerMock.addEventSubscriber).toHaveBeenCalledTimes(1);
    });
    test("delete event subscriber", async () => {
        await request(app)
            .delete(eventPath + '/subscribers')
            .set('Cookie', cookie)
            .auth("username", "password")
            .send({endpoint: "123"})
            .expect(200);

        expect(eventControllerMock.deleteEventSubscriber).toHaveBeenCalled();
    });
    test("get all event subscribers", async () => {
        await request(app)
            .get(eventPath + '/subscribers')
            .set('Cookie', cookie)
            .expect(200);

        expect(eventControllerMock.getAll).toHaveBeenCalled();
    });
    test("notify", async () => {
        await request(app)
            .post(eventPath + '/')
            .send({type: "BELL_RUNG"})
            .set('Cookie', cookie)
            .expect(200);

        expect(eventControllerMock.notify).toHaveBeenCalled();
    });

});

describe("door", () => {
    let cookie: any;

    beforeAll(async () => {

        app.use(doorPath, doorRouter.router);

        await request(app)
            .post(userPath + '/login/')
            .send({username: "cn=developer,ou=Users,dc=shihadeh,dc=intern", password: "developer_pass"})
            .expect(200)
            .then(response => {
                const cookies = response.headers['set-cookie'][0].split(',').map((item: string) => item.split(';')[0]);
                cookie = cookies.join(';');
            });
    });

    test("open", async () => {
        await request(app)
            .post(doorPath + '/open')
            .set('Cookie', cookie)
            .expect(200);

        expect(doorControllerMock.open).toHaveBeenCalledTimes(1);
    });
    test("set door microcontroller", async () => {
        await request(app)
            .post(doorPath + '/register')
            .set('Cookie', cookie)
            .set('psk', "1234")
            .send({url: "123"})
            .expect(200);

        expect(doorControllerMock.setDoorMicrocontroller).toHaveBeenCalled();
    });
    test("update door microcontroller", async () => {
        await request(app)
            .post(doorPath + '/refresh')
            .set('Cookie', cookie)
            .expect(200);

        expect(doorControllerMock.updateDoorControllerViaRequest).toHaveBeenCalled();
    });
});

describe("camera", () => {
    let cookie: any;

    beforeAll(async () => {
        app.use(cameraPath, cameraRouter.router);
    });

    test("connect", async () => {
        await request(app)
            .get(cameraPath + '/connection?quality=SD')
            .expect(200);

        expect(cameraControllerMock.connect).toHaveBeenCalledTimes(1);
    });

});
describe("notification", () => {
    let cookie: any;

    beforeAll(async () => {
        app.use(notificationPath, notificationRouter.router);
    });

    test("subscribe", async () => {
        await request(app)
            .post(notificationPath + '/push/subscription')
            .send({endpoint: "bla", keys: {auth: "blabal", p256dh: "blablablabla"}})
            .expect(200);

        expect(notificationControllerMock.subscribe).toHaveBeenCalledTimes(1);
    });

});
