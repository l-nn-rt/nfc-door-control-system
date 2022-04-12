import { InternalServerError } from '../../../model/errors';
import { DoorSingleton } from '../../../model/doorSingleton.model';
import { User } from '../../../model/user.model';
import { DatabaseEntry } from '../../../model/database/databaseEntry';
import {
    Username,
    NfcToken,
    Identifier,
    EventSubscriber,
    Event,
    Endpoint,
    SubscriberLabel
} from 'shared-utilities';
import { DatabaseEntryProperty } from '../../../model/database/databaseEntryProperty';
import databaseFactoryMock from '../../../controller/database/__mocks__/databaseFactory';
import { DatabaseService } from '../database.service';
import databaseConfigMock from '../../../model/__mocks__/databaseConfig';
import databaseConnectionMock from '../../../controller/database/__mocks__/databaseConnection';
import doorSingletonMock from '../../../model/__mocks__/doorSingleton.mock';
jest.mock('../../../controller/database/databaseFactory');
jest.mock('../../../controller/database/databaseConnection');
jest.mock('../../../model/doorSingleton.model');
jest.mock('../../../model/databaseConfig');
//jest.requireActual('../../model/doorSingleton.model');
let databaseService: DatabaseService;

beforeAll(() => {
    databaseService = DatabaseService.getInstance(databaseConfigMock, databaseFactoryMock);
    DoorSingleton.getInstance = jest.fn().mockImplementation(() => {
        return doorSingletonMock;
    });
});

beforeEach(() => {
    jest.mock('../../../controller/database/databaseFactory').clearAllMocks();
    jest.mock('../../../controller/database/databaseConnection').clearAllMocks();
    jest.mock('../../../model/databaseConfig').restoreAllMocks();
});
describe('getAllUserNames', () => {
    it('getMany rejects error', async () => {
        const error = new Error();
        databaseConnectionMock.getMany.mockRejectedValueOnce(error);
        await expect(databaseService.getAllUserNames(databaseConnectionMock)).rejects.toBe(error);
    });
    it('getManyEntries have no objects', async () => {
        const mockDatabaseNameEntries: DatabaseEntry<any>[] = [
            new DatabaseEntry(databaseConfigMock.user.location)
        ];
        databaseConnectionMock.getMany.mockResolvedValueOnce(mockDatabaseNameEntries);
        await expect(databaseService.getAllUserNames(databaseConnectionMock)).rejects.toEqual(
            new InternalServerError()
        );
    });
    it.each`
        mockNames
        ${[new Username('Name1'), new Username('Name2'), new Username('Name3')]}
        ${[]}
    `('success', async ({ mockNames }) => {
        const mockDatabaseNameEntries: DatabaseEntry<any>[] = [];
        for (let i = 0; i < mockNames.length; i++) {
            mockDatabaseNameEntries[i] = new DatabaseEntry(databaseConfigMock.user.location, {
                [databaseConfigMock.user.name.name]: mockNames[i]
            });
        }
        databaseConnectionMock.getMany.mockResolvedValueOnce(mockDatabaseNameEntries);
        await expect(databaseService.getAllUserNames(databaseConnectionMock)).resolves.toEqual(
            mockNames
        );
        expect(databaseConnectionMock.getMany).toBeCalledWith(databaseConfigMock.user.location, [
            databaseConfigMock.user.name
        ]);
    });
});
describe('getAllNfcTokens', () => {
    it('getMany rejects error', async () => {
        const error = new Error();
        databaseConnectionMock.getMany.mockRejectedValueOnce(error);
        await expect(databaseService.getAllNfcTokens(databaseConnectionMock)).rejects.toBe(error);
    });
    it('getManyEntries have no objects', async () => {
        const mockDatabaseTokenEntries: DatabaseEntry<any>[] = [
            new DatabaseEntry(databaseConfigMock.user.location)
        ];
        databaseConnectionMock.getMany.mockResolvedValueOnce(mockDatabaseTokenEntries);
        await expect(databaseService.getAllNfcTokens(databaseConnectionMock)).rejects.toEqual(
            new InternalServerError()
        );
    });
    it.each`
        mockTokens
        ${[new NfcToken('Token1'), new NfcToken('Token2'), new NfcToken('Token3')]}
        ${[]}
    `('success', async ({ mockTokens }) => {
        const mockDatabaseTokenEntries: DatabaseEntry<any>[] = [];
        for (let i = 0; i < mockTokens.length; i++) {
            mockDatabaseTokenEntries[i] = new DatabaseEntry(databaseConfigMock.user.location, {
                [databaseConfigMock.user.nfcToken.name]: mockTokens[i]
            });
        }
        databaseConnectionMock.getMany.mockResolvedValueOnce(mockDatabaseTokenEntries);
        await expect(databaseService.getAllNfcTokens(databaseConnectionMock)).resolves.toEqual(
            mockTokens
        );
        expect(databaseConnectionMock.getMany).toBeCalledWith(databaseConfigMock.user.location, [
            databaseConfigMock.user.nfcToken
        ]);
    });
});
describe('getNfcToken', () => {
    let user: User;
    beforeEach(() => {
        user = new User('mockIdentifier', 'mockUsername', 'mockToken');
    });
    it('get rejects error', async () => {
        const error = new Error();
        databaseConnectionMock.get.mockRejectedValueOnce(error);
        await expect(databaseService.getNfcToken(user, databaseConnectionMock)).rejects.toBe(error);
    });
    it('getEntry has no object', async () => {
        databaseConnectionMock.get.mockResolvedValueOnce(
            new DatabaseEntry(databaseConfigMock.user.location)
        );
        await expect(databaseService.getNfcToken(user, databaseConnectionMock)).rejects.toEqual(
            new InternalServerError()
        );
    });
    it('success', async () => {
        const filter = databaseFactoryMock.createFilter({
            ...databaseConfigMock.user.identifier,
            value: user.identifier
        } as DatabaseEntryProperty<Identifier>);
        databaseConnectionMock.get.mockResolvedValueOnce(
            new DatabaseEntry<any>(databaseConfigMock.user.location, {
                [databaseConfigMock.user.nfcToken.name]: user.nfcToken
            })
        );
        await expect(databaseService.getNfcToken(user, databaseConnectionMock)).resolves.toEqual(
            new NfcToken(user.nfcToken)
        );
        expect(JSON.stringify(databaseConnectionMock.get.mock.calls[0][2])).toEqual(
            JSON.stringify(filter)
        );
        expect(databaseConnectionMock.get).toBeCalledWith(
            databaseConfigMock.user.location,
            [databaseConfigMock.user.nfcToken],
            expect.anything()
        );
    });
});

describe('setNfcToken', () => {
    let user: User;
    beforeEach(() => {
        user = new User('mockIdentifier', 'mockUsername', 'mockToken');
        databaseConnectionMock.setProperty.mockReset();
    });
    it('setProperty rejects error', async () => {
        const error = new Error('MeinMockFehler1234');
        databaseConnectionMock.setProperty.mockRejectedValueOnce(error);
        await expect(databaseService.setNfcToken(user, databaseConnectionMock)).rejects.toBe(error);
    });

    it('success', async () => {
        const filter = databaseFactoryMock.createFilter({
            ...databaseConfigMock.user.identifier,
            value: user.identifier
        } as DatabaseEntryProperty<Identifier>);
        databaseConnectionMock.setProperty.mockResolvedValueOnce();
        await expect(
            databaseService.setNfcToken(user, databaseConnectionMock)
        ).resolves.not.toThrow();
        expect(JSON.stringify(databaseConnectionMock.setProperty.mock.calls[0][2])).toEqual(
            JSON.stringify(filter)
        );
        const property = { ...databaseConfigMock.user.nfcToken } as DatabaseEntryProperty<NfcToken>;
        property.value = user.nfcToken;
        expect(databaseConnectionMock.setProperty).toBeCalledWith(
            property,
            databaseConfigMock.user.location,
            expect.anything()
        );
    });
});
describe('getAllEventSubscriber', () => {
    it('getMany rejects error', async () => {
        const error = new Error();
        databaseConnectionMock.getMany.mockRejectedValueOnce(error);
        await expect(databaseService.getAllEventSubscriber(databaseConnectionMock)).rejects.toBe(
            error
        );
    });
    it('getManyEntries have no objects', async () => {
        databaseConnectionMock.getMany.mockResolvedValueOnce([
            new DatabaseEntry(databaseConfigMock.eventSubscriber.location)
        ]);
        await expect(databaseService.getAllEventSubscriber(databaseConnectionMock)).rejects.toEqual(
            new InternalServerError()
        );
    });
    it.each`
        mockSubscriber
        ${[new EventSubscriber(new Endpoint('subscribers/1'), Event.BELL_RUNG, new SubscriberLabel('label1')), new EventSubscriber(new Endpoint('subscribers/2'), Event.DOOR_OPENED, new SubscriberLabel('label2'))]}
        ${[]}
    `('success', async ({ mockSubscriber }) => {
        const mockDatabaseSubscriberEntries: DatabaseEntry<any>[] = [];
        for (let i = 0; i < mockSubscriber.length; i++) {
            mockDatabaseSubscriberEntries[i] = new DatabaseEntry(
                databaseConfigMock.eventSubscriber.location,
                {
                    [databaseConfigMock.eventSubscriber.endpoint.name]: mockSubscriber[i].endpoint,
                    [databaseConfigMock.eventSubscriber.label.name]: mockSubscriber[i].label,
                    [databaseConfigMock.eventSubscriber.event.name]: mockSubscriber[i].event
                }
            );
        }
        databaseConnectionMock.getMany.mockResolvedValueOnce(mockDatabaseSubscriberEntries);
        await expect(
            databaseService.getAllEventSubscriber(databaseConnectionMock)
        ).resolves.toEqual(mockSubscriber);
        expect(databaseConnectionMock.getMany).toBeCalledWith(
            databaseConfigMock.eventSubscriber.location,
            [
                databaseConfigMock.eventSubscriber.event,
                databaseConfigMock.eventSubscriber.label,
                databaseConfigMock.eventSubscriber.endpoint
            ]
        );
    });
});
describe('addEventSubscriber', () => {
    let eventSubscriber: EventSubscriber;
    beforeEach(() => {
        eventSubscriber = new EventSubscriber(
            new Endpoint('mockEndpoint'),
            Event.DOOR_OPENED,
            new SubscriberLabel('mockLabel')
        );
    });
    it('create rejects error', async () => {
        const error = new Error('MockError addEventSubscriber');
        databaseConnectionMock.create.mockRejectedValueOnce(error);
        await expect(
            databaseService.addEventSubscriber(eventSubscriber, databaseConnectionMock)
        ).rejects.toBe(error);
    });
    it('success with type', async () => {
        await expect(
            databaseService.addEventSubscriber(eventSubscriber, databaseConnectionMock)
        ).resolves.not.toThrow();
        const object = {
            [databaseConfigMock.eventSubscriber.endpoint.name]: eventSubscriber.endpoint,
            [databaseConfigMock.eventSubscriber.event.name]: eventSubscriber.event,
            [databaseConfigMock.eventSubscriber.label.name]: eventSubscriber.label
        };
        expect(databaseConnectionMock.create).toBeCalledWith(
            new DatabaseEntry(
                databaseConfigMock.eventSubscriber.location,
                object,
                {
                    ...databaseConfigMock.eventSubscriber.identifier,
                    value: eventSubscriber.endpoint.toString()
                } as DatabaseEntryProperty<string>,
                { ...databaseConfigMock.eventSubscriber.type } as DatabaseEntryProperty<string>
            )
        );
    });
    it('success without type', async () => {
        databaseConfigMock.eventSubscriber.type = undefined;
        await expect(
            databaseService.addEventSubscriber(eventSubscriber, databaseConnectionMock)
        ).resolves.not.toThrow();
        const object = {
            [databaseConfigMock.eventSubscriber.endpoint.name]: eventSubscriber.endpoint,
            [databaseConfigMock.eventSubscriber.event.name]: eventSubscriber.event,
            [databaseConfigMock.eventSubscriber.label.name]: eventSubscriber.label
        };
        expect(databaseConnectionMock.create).toBeCalledWith(
            new DatabaseEntry(databaseConfigMock.eventSubscriber.location, object, {
                ...databaseConfigMock.eventSubscriber.identifier,
                value: eventSubscriber.endpoint.toString()
            } as DatabaseEntryProperty<string>)
        );
    });
});
describe('deleteEventSubscriber', () => {
    let eventSubscriber: EventSubscriber;
    beforeEach(() => {
        eventSubscriber = new EventSubscriber(
            new Endpoint('mockEndpoint'),
            Event.DOOR_OPENED,
            new SubscriberLabel('mockLabel')
        );
    });
    it('delete rejects error', async () => {
        const error = new Error('MockError deleteEventSubscriber');
        databaseConnectionMock.delete.mockRejectedValueOnce(error);
        await expect(
            databaseService.deleteEventSubscriber(eventSubscriber, databaseConnectionMock)
        ).rejects.toBe(error);
    });
    it('success', async () => {
        const filter = databaseFactoryMock.createFilter({
            ...databaseConfigMock.eventSubscriber.identifier,
            value: eventSubscriber.endpoint
        } as DatabaseEntryProperty<Identifier>);
        await expect(
            databaseService.deleteEventSubscriber(eventSubscriber, databaseConnectionMock)
        ).resolves.not.toThrow();
        expect(JSON.stringify(databaseConnectionMock.delete.mock.calls[0][1])).toEqual(
            JSON.stringify(filter)
        );
        expect(databaseConnectionMock.delete).toBeCalledWith(
            databaseConfigMock.eventSubscriber.location,
            expect.anything()
        );
    });
});
