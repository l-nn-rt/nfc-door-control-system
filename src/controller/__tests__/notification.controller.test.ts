import {Response} from "express";
import {NotificationController} from "../notification.controller";
import webPush from "../../../__mocks__/web-push";
import {getMockReq, getMockRes} from "@jest-mock/express";
import webpush from "web-push";

jest.mock('web-push');

let req = getMockReq();
let {res, clearMockRes} = getMockRes()

const n = 10;
const m = 5;


let notificationController: NotificationController;

beforeEach(() => {
    notificationController = new NotificationController();
    clearMockRes();
});

describe("NotificationController.subscribe", () => {
    test("correct value", async () => {
        req = getMockReq({body: {endpoint: "123"}});
        await notificationController.subscribe(req, res);

        expect(res.status).toHaveBeenCalledWith(201);

    });
});

async function addNotificationSubscribers(amount: number): Promise<void> {
    for (let i = 0; i < amount; i++) {
        req = getMockReq({body: {endpoint: i.toString()}});
        await notificationController.subscribe(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
    }
}

describe("NotificationController.sendNotification", () => {

    afterEach(() => {
        webPush.sendNotification.mockClear();
    });

    test("expect no notification", async () => {
        await notificationController.sendNotification("test", "body");
        expect(webPush.sendNotification).toHaveBeenCalledTimes(0);
    });

    test("expect one notification", async () => {

        await addNotificationSubscribers(1);

        await notificationController.sendNotification("test","body");
        expect(webPush.sendNotification).toHaveBeenCalledTimes(1);
    });

    test("expect n notification", async () => {

        await addNotificationSubscribers(n);

        await notificationController.sendNotification("test","body");
        expect(webPush.sendNotification).toHaveBeenCalledTimes(n);
    });

    test("expect n notification with m subscribers subscribed multiple times", async () => {

        await addNotificationSubscribers(n);
        await addNotificationSubscribers(m);

        await notificationController.sendNotification("test","body");
        expect(webPush.sendNotification).toHaveBeenCalledTimes(n);
    });

    test("expect no crash if notification fails", async () => {

        webPush.sendNotification.mockReturnValue(Promise.reject("webpush.sendNotification rejects successfully"));

        await addNotificationSubscribers(n);

        await notificationController.sendNotification("test","body");
        expect(webPush.sendNotification).toHaveBeenCalledTimes(n);
    });


});