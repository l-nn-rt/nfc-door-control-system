import { DatabaseService } from '../../services/database/database.service';
import { HttpService } from '../../services/http.service';

import { EventController } from '../event.controller';

import notificationControllerMock from '../__mocks__/notification.controller';
import databaseServiceMock from '../../services/database/__mocks__/database.service.mock';
import httpServiceMock from '../../services/__mocks__/http.service.mock';
import databaseFactoryMock from '../database/__mocks__/databaseFactory';

import { getMockReq, getMockRes } from '@jest-mock/express';
import { EventSubscriber, Event } from 'shared-utilities';

jest.mock('../../services/database/database.service');
jest.mock('../../services/http.service');

const n = 10;

let eventController: EventController;

let req = getMockReq();
let { res, clearMockRes } = getMockRes();

const eventSubscribers: Array<EventSubscriber> = [];

beforeAll(() => {
    for (let i = 0; i < n; i++) {
        eventSubscribers.push(
            new EventSubscriber(
                i.toString(),
                i % 2 == 0 ? Event.BELL_RUNG : Event.DOOR_OPENED,
                i.toString()
            )
        );
    }
});

beforeEach(() => {
    eventController = new EventController(notificationControllerMock, databaseFactoryMock);

    clearMockRes();
    req = getMockReq();

    databaseFactoryMock.createMidwareConnection.mockClear();
    databaseServiceMock.getAllEventSubscriber.mockClear();
    databaseServiceMock.addEventSubscriber.mockClear();
    databaseServiceMock.deleteEventSubscriber.mockClear();

    notificationControllerMock.sendNotification.mockClear();

    DatabaseService.getInstance = jest.fn().mockReturnValue(databaseServiceMock);
    HttpService.getInstance = jest.fn().mockReturnValue(httpServiceMock);
});

describe('notify', () => {
    test('successfully notify DOOR_OPENED', async () => {
        databaseServiceMock.getAllEventSubscriber.mockResolvedValueOnce(eventSubscribers);
        httpServiceMock.post.mockResolvedValue({ status: 200 } as Response);

        req = getMockReq({ body: { type: Event.DOOR_OPENED } });
        await eventController.notify(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            msg: `5/5 got notified`
        });
    });
    test('unsuccessfully notify DOOR_OPENED', async () => {
        databaseServiceMock.getAllEventSubscriber.mockResolvedValueOnce(eventSubscribers);
        httpServiceMock.post.mockResolvedValue({ status: 400 } as Response);

        req = getMockReq({ body: { type: Event.DOOR_OPENED } });
        await eventController.notify(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            msg: `0/5 got notified`
        });
    });
    test('successfully notify BELL_RUNG', async () => {
        databaseServiceMock.getAllEventSubscriber.mockResolvedValueOnce(eventSubscribers);
        httpServiceMock.post.mockResolvedValue({ status: 200 } as Response);

        req = getMockReq({ body: { type: Event.BELL_RUNG } });
        await eventController.notify(req, res);

        expect(notificationControllerMock.sendNotification).toBeCalledTimes(1);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            msg: `5/5 got notified`
        });
    });
    test('unsuccessfully notify BELL_RUNG', async () => {
        databaseServiceMock.getAllEventSubscriber.mockResolvedValueOnce(eventSubscribers);
        httpServiceMock.post.mockRejectedValue(new Error('test failure'));

        req = getMockReq({ body: { type: Event.BELL_RUNG } });
        await eventController.notify(req, res);

        expect(notificationControllerMock.sendNotification).toBeCalledTimes(1);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            msg: `0/5 got notified`
        });
    });
    test('private method loadEventSubscribers rejects', async () => {
        databaseServiceMock.getAllEventSubscriber.mockRejectedValue(new Error('test failure'));

        req = getMockReq({ body: { type: Event.BELL_RUNG } });
        await eventController.notify(req, res);

        expect(notificationControllerMock.sendNotification).toBeCalledTimes(1);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});
describe('deleteEventSubscriber', () => {
    test('success', async () => {
        databaseServiceMock.getAllEventSubscriber.mockResolvedValueOnce(eventSubscribers);
        databaseServiceMock.deleteEventSubscriber.mockResolvedValue();

        req = getMockReq({ body: { endpoint: eventSubscribers[0].endpoint } });
        await eventController.deleteEventSubscriber(req, res);

        expect(databaseServiceMock.deleteEventSubscriber).toBeCalledTimes(1);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('delete event subscriber rejects', async () => {
        databaseServiceMock.getAllEventSubscriber.mockResolvedValueOnce(eventSubscribers);
        databaseServiceMock.deleteEventSubscriber.mockRejectedValueOnce(new Error());

        await eventController.deleteEventSubscriber(req, res);

        expect(databaseServiceMock.deleteEventSubscriber).toBeCalledTimes(1);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('database not reachable', async () => {
        const errorMessage = 'test error';

        databaseFactoryMock.createMidwareConnection.mockRejectedValueOnce(new Error(errorMessage));

        await eventController.deleteEventSubscriber(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: {
                message: errorMessage
            }
        });
    });

    test('unexpected error', async () => {
        // @ts-ignore
        databaseServiceMock.deleteEventSubscriber.mockReturnValueOnce(undefined);

        await eventController.deleteEventSubscriber(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });
});
describe('getAll', () => {
    test('success', async () => {
        databaseServiceMock.getAllEventSubscriber.mockResolvedValue(eventSubscribers);

        await eventController.getAll(req, res);

        expect(databaseFactoryMock.createMidwareConnection).toBeCalledTimes(1);

        expect(databaseServiceMock.getAllEventSubscriber).toBeCalledTimes(1);

        expect(res.status).toHaveBeenCalledWith(200);
        const expectedReturnValue = {
            eventSubscribers: eventSubscribers.map((value) => {
                return {
                    label: value.label,
                    endpoint: value.endpoint,
                    event: value.event
                };
            })
        };
        expect(res.json).toHaveBeenCalledWith(expectedReturnValue);
    });

    /* // This test would fail due to removed caching 
    test("success after event subscribers are gotten from database", async () => {
        databaseServiceMock.getAllEventSubscriber.mockResolvedValueOnce(eventSubscribers);

        await eventController.getAll(req, res);

        expect(databaseFactoryMock.createMidwareConnection).toBeCalledTimes(1);

        expect(databaseServiceMock.getAllEventSubscriber).toBeCalledTimes(1);

        expect(res.status).toHaveBeenCalledWith(200);
        const expectedReturnValue = {
            "eventSubscribers": eventSubscribers.map(value => {
                return {
                    label: value.label,
                    endpoint: value.endpoint,
                    event: value.event
                }
            })
        }
        expect(res.json).toHaveBeenCalledWith(expectedReturnValue);

        await eventController.getAll(req, res);

        expect(databaseFactoryMock.createMidwareConnection).toBeCalledTimes(1);

        expect(databaseServiceMock.getAllEventSubscriber).toBeCalledTimes(1);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expectedReturnValue);

    });*/

    test('database not reachable', async () => {
        const errorMessage = 'test error';

        databaseFactoryMock.createMidwareConnection.mockRejectedValueOnce(new Error(errorMessage));

        await eventController.getAll(req, res);

        expect(databaseFactoryMock.createMidwareConnection).toBeCalledTimes(1);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: {
                message: errorMessage
            }
        });
    });

    test('get event subscribers rejects', async () => {
        databaseServiceMock.getAllEventSubscriber.mockRejectedValueOnce(new Error());

        await eventController.getAll(req, res);

        expect(databaseFactoryMock.createMidwareConnection).toBeCalledTimes(1);

        expect(databaseServiceMock.getAllEventSubscriber).toBeCalledTimes(1);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    test('unexpected error', async () => {
        // @ts-ignore
        databaseServiceMock.getAllEventSubscriber.mockReturnValueOnce(undefined);

        await eventController.getAll(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });
});
describe('addEventSubscriber', () => {
    test('success', async () => {
        databaseServiceMock.getAllEventSubscriber.mockResolvedValueOnce(eventSubscribers);
        databaseServiceMock.addEventSubscriber.mockResolvedValue();

        req = getMockReq({
            body: {
                endpoint: 'eventSubscribers[0].endpoint',
                label: 'eventSubscribers[0].label',
                event: Event.BELL_RUNG
            }
        });
        await eventController.addEventSubscriber(req, res);

        expect(databaseServiceMock.addEventSubscriber).toBeCalledTimes(1);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('add event subscriber rejects', async () => {
        databaseServiceMock.getAllEventSubscriber.mockResolvedValueOnce(eventSubscribers);
        databaseServiceMock.addEventSubscriber.mockRejectedValueOnce(new Error());

        req = getMockReq({
            body: {
                endpoint: 'eventSubscribers[0].endpoint',
                label: 'eventSubscribers[0].label',
                event: Event.BELL_RUNG
            }
        });

        await eventController.addEventSubscriber(req, res);

        expect(databaseServiceMock.addEventSubscriber).toBeCalledTimes(1);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('database not reachable', async () => {
        const errorMessage = 'test error';

        databaseFactoryMock.createMidwareConnection.mockRejectedValueOnce(new Error(errorMessage));

        await eventController.addEventSubscriber(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: {
                message: errorMessage
            }
        });
    });

    test('unexpected error', async () => {
        // @ts-ignore
        databaseServiceMock.addEventSubscriber.mockReturnValueOnce(undefined);

        await eventController.addEventSubscriber(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });
});
