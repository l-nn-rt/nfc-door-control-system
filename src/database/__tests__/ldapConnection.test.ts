import {LdapConnection} from "../ldapConnection";
import databaseConfigMock from "../../model/__mocks__/databaseConfig";
import {Config} from "../../model/config.model";
import ldap from "../../../__mocks__/ldapjs";
import {EntryNotFound, InvalidCredentialsError, ReachDatabaseError, UnknownError} from "../../model/errors";
import {DatabaseCredentials} from "../databaseCredentials";
import {DatabaseEntry} from "../databaseEntry";
import {DatabaseEntryProperty} from "../databaseEntryProperty";
import {DatabaseLocation} from "../databaseLocation";
import {Change, Error, ErrorCallback} from "ldapjs";
import {LanguageService} from "../../services/language.service";
import {ERROR_MESSAGES} from "../../res/error.messages";
import databaseFactoryMock from "../__mocks__/databaseFactory";
import {LdapFilter} from "../ldapFilter";

import {NfcToken, Identifier} from 'shared-utilities';
import exp from "constants";

jest.mock('ldapjs');


let ldapConnection: LdapConnection;

beforeAll(async () => {

    ldapConnection = new LdapConnection(databaseConfigMock.midware.credentials, "", databaseConfigMock);

    ldap.createClient().connectListener();

    await ldapConnection.ready.catch(() => {
    });

});

beforeEach(() => {
    ldap.createClient().searchEntryListenerTimes = 0;
    ldap.createClient().endListenerTimes = 0
    ldap.createClient().errorListenerTimes = 0;
    ldap.createClient().searchError = null;
});

describe("constructor", () => {
    test("create connection from username", async () => {
        ldapConnection = new LdapConnection(new DatabaseCredentials("Lennart", "hooo"),
            "", databaseConfigMock);

        ldap.createClient().connectListener();

        await expect(ldapConnection.ready).rejects.toThrow(new InvalidCredentialsError().message);
    });
})

describe("ready", () => {
    test("success", async () => {
        let ldapConnection = new LdapConnection(databaseConfigMock.midware.credentials, "", databaseConfigMock);

        ldap.createClient().connectListener();

        await ldapConnection.ready.catch(() => {
            expect(0).toBe(1);
        });
    });
    test("invalid credentials", async () => {
        ldapConnection = new LdapConnection(new DatabaseCredentials("midwareCredentialNameMock",
            "midwareCredentialNameMock"), "", databaseConfigMock);

        ldap.createClient().connectListener();

        await expect(ldapConnection.ready).rejects.toThrow(new InvalidCredentialsError().message);
    });
    test("connection error", async () => {
        ldapConnection = new LdapConnection(databaseConfigMock.midware.credentials, "", databaseConfigMock);

        ldap.createClient().errorListener();

        await expect(ldapConnection.ready).rejects.toThrow(new ReachDatabaseError().message);
    });
});

describe("create", () => {
    const identifier = {
        ...databaseConfigMock.eventSubscriber.identifier
    } as DatabaseEntryProperty<string>;
    identifier.value = "test1234";

    const type = {...databaseConfigMock.eventSubscriber.type} as
        | DatabaseEntryProperty<string>
        | undefined;

    const object = {
        [databaseConfigMock.eventSubscriber.event.name]: 'BELL_RUNG',
        [databaseConfigMock.eventSubscriber.label.name]: "test1234",
        [databaseConfigMock.eventSubscriber.endpoint.name]: "test1234"
    };
    test("success", async () => {
        await expect(ldapConnection.create(new DatabaseEntry<any>(
            {...databaseConfigMock.eventSubscriber.location} as DatabaseLocation,
            object,
            identifier,
            type
        ))).resolves.not.toThrow();
    });
    test("client rejects", async () => {
        ldap.createClient().add.mockImplementationOnce((name: string, entry: Object, callback: ErrorCallback) => {
            callback({
                code: 12,
                name: "string",
                message: "string",
            } as Error);
        });

        await expect(ldapConnection.create(new DatabaseEntry<any>(
            {...databaseConfigMock.eventSubscriber.location} as DatabaseLocation,
            object,
            identifier,
            type
        ))).rejects.toThrow(new UnknownError().message);
    });
    test("IDENTIFIER_TYPE_MANDATORY", async () => {
        await expect(ldapConnection.create(new DatabaseEntry<any>(
            {...databaseConfigMock.eventSubscriber.location} as DatabaseLocation,
            object,
            identifier,
        ))).rejects.toThrow(LanguageService.getInstance().translate(
            ERROR_MESSAGES.IDENTIFIER_TYPE_MANDATORY
        ));
    });
});
describe("delete", () => {
    const identifier: DatabaseEntryProperty<string> = {
        ...databaseConfigMock.eventSubscriber.identifier
    } as DatabaseEntryProperty<string>;
    identifier.value = "ding dong";
    let filter = databaseFactoryMock.createFilter(identifier);


    test("success without filter", async () => {
        await expect(ldapConnection.delete({...databaseConfigMock.eventSubscriber.location} as DatabaseLocation))
            .resolves.not.toThrow();
    });
    test("success with filter", async () => {
        ldap.createClient().searchEntryListenerTimes = 1;
        ldap.createClient().endListenerTimes = 1;

        await expect(ldapConnection.delete({...databaseConfigMock.eventSubscriber.location} as DatabaseLocation,
            filter as LdapFilter))
            .resolves.not.toThrow();
    });
    test("deletion fails with filter", async () => {
        ldap.createClient().searchEntryListenerTimes = 1;
        ldap.createClient().endListenerTimes = 1;

        ldap.createClient().del.mockImplementationOnce((name: string, callback: ErrorCallback) => {
            return callback({
                code: 12,
                name: "string",
                message: "string",
            } as Error);
        });

        await expect(ldapConnection.delete({...databaseConfigMock.eventSubscriber.location} as DatabaseLocation,
            filter as LdapFilter))
            .rejects.toThrow(new UnknownError().message);
    });
    test("deletion fails with filter2", async () => {
        ldap.createClient().searchEntryListenerTimes = 1;
        ldap.createClient().endListenerTimes = 1;
        ldap.createClient().errorListenerTimes = 1;

        await expect(ldapConnection.delete({...databaseConfigMock.eventSubscriber.location} as DatabaseLocation,
            filter as LdapFilter))
            .rejects.toThrow(new UnknownError().message);
    });
    test("deletion fails with filter3", async () => {
        ldap.createClient().searchEntryListenerTimes = 1;
        ldap.createClient().endListenerTimes = 1;
        ldap.createClient().searchError = {
            code: 32,
            name: "string",
            message: "string",
        } as Error;

        await expect(ldapConnection.delete({...databaseConfigMock.eventSubscriber.location} as DatabaseLocation,
            filter as LdapFilter))
            .rejects.toThrow(new EntryNotFound().message);
    });
    test("entry not found with filter", async () => {
        ldap.createClient().searchEntryListenerTimes = 0;
        ldap.createClient().endListenerTimes = 1;


        await expect(ldapConnection.delete({...databaseConfigMock.eventSubscriber.location} as DatabaseLocation,
            filter as LdapFilter))
            .rejects.toThrow(new EntryNotFound().message);
    });
    test("failure without filter", async () => {
        ldap.createClient().del.mockImplementationOnce((name: string, callback: ErrorCallback) => {
            return callback({
                code: 12,
                name: "string",
                message: "string",
            } as Error);
        });

        await expect(ldapConnection.delete({...databaseConfigMock.eventSubscriber.location} as DatabaseLocation))
            .rejects.toThrow(new UnknownError().message);
    });
});
describe("get", () => {
    let nfcToken: DatabaseEntryProperty<NfcToken> = {
        ...databaseConfigMock.user.nfcToken
    } as DatabaseEntryProperty<NfcToken>;
    let userDatabaseLocation: DatabaseLocation = {
        ...databaseConfigMock.user.location
    } as DatabaseLocation;
    let identifier: DatabaseEntryProperty<Identifier> = {
        ...databaseConfigMock.user.identifier
    } as DatabaseEntryProperty<Identifier>;
    identifier.value = "blup";

    let filter = databaseFactoryMock.createFilter(identifier);
    const T = {[databaseConfigMock.user.nfcToken.name]: NfcToken};


    test("success without filter", async () => {
        ldap.createClient().searchEntryListenerTimes = 1;
        ldap.createClient().endListenerTimes = 0
        const value = await ldapConnection.get<typeof T>(userDatabaseLocation, [nfcToken]);
        expect(value.object).toEqual({[databaseConfigMock.user.nfcToken.name]: "hallo"});
    });

    test("success with filter", async () => {
        ldap.createClient().searchEntryListenerTimes = 1;
        ldap.createClient().endListenerTimes = 0
        const value = await ldapConnection.get<typeof T>(userDatabaseLocation, [nfcToken], filter as LdapFilter);
        expect(value.object).toEqual({[databaseConfigMock.user.nfcToken.name]: "hallo"});
    });
    test("get fails with filter", async () => {
        ldap.createClient().searchEntryListenerTimes = 0;
        ldap.createClient().endListenerTimes = 1;

        await expect(ldapConnection.get<typeof T>(userDatabaseLocation, [nfcToken], filter as LdapFilter))
            .rejects.toThrow(new EntryNotFound().message);
    });
    test("get fails with filter2", async () => {
        ldap.createClient().errorListenerTimes = 1;

        await expect(ldapConnection.get<typeof T>(userDatabaseLocation, [nfcToken], filter as LdapFilter))
            .rejects.toThrow(new UnknownError().message);
    });
    test("get fails with filter3", async () => {
        ldap.createClient().searchError = {
            code: 32,
            name: "string",
            message: "string",
        } as Error;

        await expect(ldapConnection.get<typeof T>(userDatabaseLocation, [nfcToken], filter as LdapFilter))
            .rejects.toThrow(new EntryNotFound().message);
    });
});
describe("getMany", () => {
    let nfcToken: DatabaseEntryProperty<NfcToken> = {
        ...databaseConfigMock.user.nfcToken
    } as DatabaseEntryProperty<NfcToken>;
    let userDatabaseLocation: DatabaseLocation = {
        ...databaseConfigMock.user.location
    } as DatabaseLocation;
    let identifier: DatabaseEntryProperty<Identifier> = {
        ...databaseConfigMock.user.identifier
    } as DatabaseEntryProperty<Identifier>;
    identifier.value = "blup";

    let filter = databaseFactoryMock.createFilter(identifier);
    const T = {[databaseConfigMock.user.nfcToken.name]: NfcToken};


    test("success without filter", async () => {
        ldap.createClient().searchEntryListenerTimes = 2;
        ldap.createClient().endListenerTimes = 1;
        const value = await ldapConnection.getMany<typeof T>(userDatabaseLocation, [nfcToken]);

        expect(value.length).toEqual(ldap.createClient().searchEntryListenerTimes);
        value.map((value) => {
            return value.object
        }).forEach(value => {
            expect(value).toEqual(expect.objectContaining(
                {[databaseConfigMock.user.nfcToken.name]: "hallo"}
            ));
        });
    });

    test("success with filter", async () => {
        ldap.createClient().searchEntryListenerTimes = 4;
        ldap.createClient().endListenerTimes = 1;

        const value = await ldapConnection.getMany<typeof T>(userDatabaseLocation, [nfcToken], filter as LdapFilter);
        expect(value.length).toEqual(ldap.createClient().searchEntryListenerTimes);
        value.map((value) => {
            return value.object
        }).forEach(value => {
            expect(value).toEqual(expect.objectContaining(
                {[databaseConfigMock.user.nfcToken.name]: "hallo"}
            ));
        });
    });

    test("empty response", async () => {
        ldap.createClient().searchEntryListenerTimes = 0;
        ldap.createClient().endListenerTimes = 1;

        await expect(ldapConnection.getMany<typeof T>(userDatabaseLocation, [nfcToken], filter as LdapFilter))
            .resolves.toEqual([]);
    });
    test("get many fails", async () => {
        ldap.createClient().errorListenerTimes = 1;

        await expect(ldapConnection.getMany<typeof T>(userDatabaseLocation, [nfcToken], filter as LdapFilter))
            .rejects.toThrow(new UnknownError().message);
    });
    test("get many fails2", async () => {
        ldap.createClient().searchError = {
            code: 32,
            name: "string",
            message: "string",
        } as Error;

        await expect(ldapConnection.getMany<typeof T>(userDatabaseLocation, [nfcToken], filter as LdapFilter))
            .rejects.toThrow(new EntryNotFound().message);
    });

});
describe("setProperty", () => {
    let nfcToken: DatabaseEntryProperty<NfcToken> = {
        ...databaseConfigMock.user.nfcToken
    } as DatabaseEntryProperty<NfcToken>;
    nfcToken.value = "1233";
    let userDatabaseLocation: DatabaseLocation = {
        ...databaseConfigMock.user.location
    } as DatabaseLocation;
    let identifier: DatabaseEntryProperty<Identifier> = {
        ...databaseConfigMock.user.identifier
    } as DatabaseEntryProperty<Identifier>;
    identifier.value = "hilfeeee";
    let filter = databaseFactoryMock.createFilter(identifier);


    test("success without filter", async () => {
        await expect(ldapConnection.setProperty(identifier, userDatabaseLocation)).resolves.not.toThrow();
    });

    test("success with filter", async () => {
        ldap.createClient().searchEntryListenerTimes = 1;
        ldap.createClient().endListenerTimes = 1;

        await expect(ldapConnection.setProperty(identifier, userDatabaseLocation, filter as LdapFilter))
            .resolves.not.toThrow();
    });
    test("set property fails with filter", async () => {
        ldap.createClient().searchEntryListenerTimes = 1;
        ldap.createClient().endListenerTimes = 1;

        ldap.createClient().modify.mockImplementationOnce((name: string, change: Change | Array<Change>, callback: ErrorCallback) => {
            return callback({
                code: 12,
                name: "string",
                message: "string",
            } as Error);
        });

        await expect(ldapConnection.setProperty(identifier, userDatabaseLocation, filter as LdapFilter))
            .rejects.toThrow(new UnknownError().message);
    });
    test("set property fails with filter2", async () => {
        ldap.createClient().searchEntryListenerTimes = 1;
        ldap.createClient().endListenerTimes = 1;
        ldap.createClient().errorListenerTimes = 1;

        await expect(ldapConnection.setProperty(identifier, userDatabaseLocation, filter as LdapFilter))
            .rejects.toThrow(new UnknownError().message);
    });
    test("set property fails with filter3", async () => {
        ldap.createClient().searchEntryListenerTimes = 1;
        ldap.createClient().endListenerTimes = 1;
        ldap.createClient().searchError = {
            code: 32,
            name: "string",
            message: "string",
        } as Error;

        await expect(ldapConnection.setProperty(identifier, userDatabaseLocation, filter as LdapFilter))
            .rejects.toThrow(new EntryNotFound().message);
    });
    test("entry not found with filter", async () => {
        ldap.createClient().searchEntryListenerTimes = 0;
        ldap.createClient().endListenerTimes = 1;


        await expect(ldapConnection.setProperty(identifier, userDatabaseLocation, filter as LdapFilter))
            .rejects.toThrow(new EntryNotFound().message);
    });
    test("failure without filter", async () => {
        ldap.createClient().modify.mockImplementationOnce((name: string, change: Change | Array<Change>, callback: ErrorCallback) => {
            return callback({
                code: 12,
                name: "string",
                message: "string",
            } as Error);
        });

        await expect(ldapConnection.setProperty(identifier, userDatabaseLocation))
            .rejects.toThrow(new UnknownError().message);
    });
});