import { ERROR_MESSAGES } from './../../res/error.messages';
import { LanguageService } from './../../services/language.service';
import { SqlFactory } from './../sqlFactory';
import { Identifier } from 'shared-utilities';
import { DatabaseEntryProperty } from './../databaseEntryProperty';
import { DatabaseLocation } from './../databaseLocation';
import { requestMock, Row } from '../__mocks__/tedious.mock';
import { DatabaseEntry } from './../databaseEntry';
import {
    ReachDatabaseError,
    InvalidCredentialsError,
    InternalServerError,
    EntryNotFound,
    AuthenticationError
} from './../../model/errors';
import databaseConfigMock from '../../model/__mocks__/databaseConfig';
import { DatabaseCredentials } from '../databaseCredentials';
import { SqlConnection, SQLAuth, SQLAuthObj } from './../sqlConnection';
import { Connection, Request } from 'tedious';
import { connectionMock } from '../__mocks__/tedious.mock';
import { DatabaseEntryObject } from '../databaseConnection';
let sqlConnection: SqlConnection;
const credentialsMock: DatabaseCredentials = new DatabaseCredentials(
    'mockUsername',
    'mockPassword'
);
const locationMock = { name: 'mockLocation' } as DatabaseLocation;
jest.mock('tedious');

jest.mocked(Connection).mockImplementation((config) => connectionMock as any as Connection);
jest.mocked(Request).mockImplementation(
    //@ts-ignore
    (sql: string, callback: (error: Error | null, rowCount: number, rows: any[]) => any) => {
        requestMock.sql = sql;
        requestMock.callback = callback;
        return requestMock as any as Request;
    }
);
beforeEach(() => {
    sqlConnection = new SqlConnection(credentialsMock, 'mockDatabaseUrl', databaseConfigMock);
    jest.restoreAllMocks();
    requestMock.restore();
    connectionMock.restore();
});
describe('connect', () => {
    const userGroups = ['userGroup1', 'userGroup2'];
    it('error reaching database', async () => {
        connectionMock.connectError = new Error();
        await expect(sqlConnection.connect()).rejects.toEqual(new ReachDatabaseError());
    });
    it('could not get user groups', async () => {
        const error = new Error('mockError getting usergroups');
        //@ts-ignore
        jest.spyOn(sqlConnection, 'getUserGroups').mockRejectedValueOnce(error);
        await expect(sqlConnection.connect()).rejects.toEqual(error);
    });
    it('could not get password', async () => {
        const error = new Error('mockError getting password');
        connectionMock.userGroups = userGroups;
        connectionMock.execSQLError = error;

        await expect(sqlConnection.connect()).rejects.toEqual(error);
    });

    it('password invalid', async () => {
        connectionMock.userGroups = userGroups;
        connectionMock.authUsers = [credentialsMock.name.toString()];
        connectionMock.password = 'wrongPassword';
        await expect(sqlConnection.connect()).rejects.toEqual(new InvalidCredentialsError());
    });
    it('success', async () => {

        jest.spyOn(sqlConnection, 'get').mockImplementation((location, properties, filter?) => {
            if (!databaseConfigMock.auth) {
                throw Error();
            }
            if (properties.includes(databaseConfigMock.auth.password)) {
                return Promise.resolve(
                    new DatabaseEntry(location, {
                        [databaseConfigMock.auth.password.name]: credentialsMock.password
                        
                    } as DatabaseEntryObject)
                );
            }
            if (properties.includes(databaseConfigMock.auth.groups.member)) {
                return Promise.resolve(
                    new DatabaseEntry(location, {
                        [databaseConfigMock.auth.groups.member.name]: JSON.stringify([
                            'mockGruppe1'
                        ])
                    })
                );
            }
            return Promise.reject(new EntryNotFound());
        });
        connectionMock.connectCallBack();
        await expect(sqlConnection.connect()).resolves.not.toThrow();
    });
});
describe('create', () => {
    let databaseEntry: DatabaseEntry<object>;
    const object: DatabaseEntryObject = {
        attr1: 'val1',
        attr2: 42
    };
    beforeEach(() => {
        if (databaseConfigMock.auth) {
            object[databaseConfigMock.auth?.permission.name] = new SQLAuth(
                new SQLAuthObj(
                    [credentialsMock.name.toString()],
                    databaseConfigMock.auth.groups.default.read
                ),
                new SQLAuthObj(
                    [credentialsMock.name.toString()],
                    databaseConfigMock.auth.groups.default.write
                )
            );
        }

        databaseEntry = new DatabaseEntry({ name: 'mockLocation' } as DatabaseLocation, object);
    });
    it('database unreachable', async () => {
        const error = new ReachDatabaseError();
        connectionMock.connect = jest.fn((callback: (error?: any) => any) => {
            callback(error);
        });
        await expect(sqlConnection.create(databaseEntry)).rejects.toBe(error);
    });
    it('entry has no object', async () => {
        databaseEntry = new DatabaseEntry(locationMock);
        await expect(sqlConnection.create(databaseEntry)).rejects.toEqual(
            new InternalServerError()
        );
    });
    it('success', async () => {
        connectionMock.connect = jest.fn((callback: (error?: any) => any) => {
            callback();
            requestMock.callback(null, 0, []);
        });
        await sqlConnection.create(databaseEntry);
        expect(connectionMock.execSql).toBeCalled();
        let keys = '';
        let values = '';
        for (let prop in object) {
            values += `${object[prop] ? "'" + JSON.stringify(object[prop]) + "'" : 'null'}, `;
            keys += `[${prop}], `;
        }
        values = values.slice(0, -2);
        keys = keys.slice(0, -2);
        expect(requestMock.sql).toBe(
            `INSERT INTO [${databaseEntry.location.name}] (${keys}) VALUES (${values});`
        );
    });
});

describe('get / getmany', () => {
    const object: DatabaseEntryObject = {
        attr1: 'val1',
        attr2: 42
    };
    const otherObject: DatabaseEntryObject = {
        attr1: 'otherval',
        attr2: 1337
    };
    if (databaseConfigMock.auth) {
        object[databaseConfigMock.auth?.permission.name] = new SQLAuth(
            new SQLAuthObj(
                [credentialsMock.name.toString()],
                databaseConfigMock.auth.groups.default.read
            ),
            new SQLAuthObj(
                [credentialsMock.name.toString()],
                databaseConfigMock.auth.groups.default.write
            )
        );
    }
    let databaseEntry = new DatabaseEntry(
        locationMock,
        object,
        new DatabaseEntryProperty<Identifier>('mockIdenitfierName', 'mockIdentifierValue')
    );
    let otherDatabaseEntry = new DatabaseEntry(
        locationMock,
        otherObject,
        new DatabaseEntryProperty<Identifier>('mockIdenitfierName', 'otherMockIdentifierValue')
    );
    it('not authorized', async () => {
        if (!databaseEntry.object) {
            throw new Error();
        }
        const property = new DatabaseEntryProperty(
            Object.keys(databaseEntry.object)[0],
            databaseEntry.object[Object.keys(databaseEntry.object)[0]]
        );
        connectionMock.authUsers = ['otherUser'];
        connectionMock.authGroups = ['otherGroup'];
        await expect(
            sqlConnection.get(
                locationMock,
                [property],
                databaseEntry.identifier
                    ? SqlFactory.createFilter(databaseEntry.identifier)
                    : undefined
            )
        ).rejects.toStrictEqual(new AuthenticationError('Illegal read access.'));
    });
    it('database unreachable', async () => {
        if (!databaseEntry.object) {
            throw new Error();
        }
        const error = new ReachDatabaseError();
        const property = new DatabaseEntryProperty(
            Object.keys(databaseEntry.object)[0],
            databaseEntry.object[Object.keys(databaseEntry.object)[0]]
        );
        connectionMock.connect = jest.fn((callback: (error?: any) => any) => {
            callback(error);
        });
        connectionMock.authUsers = [credentialsMock.name.toString()];
        await expect(
            sqlConnection.get(
                locationMock,
                [property],
                databaseEntry.identifier
                    ? SqlFactory.createFilter(databaseEntry.identifier)
                    : undefined
            )
        ).rejects.toBe(error);
    });
    it('entry was not found', async () => {
        if (!databaseEntry.object) {
            throw new Error();
        }
        const property = new DatabaseEntryProperty(
            Object.keys(databaseEntry.object)[0],
            databaseEntry.object[Object.keys(databaseEntry.object)[0]]
        );
        connectionMock.connect = jest.fn((callback: (error?: any) => any) => {
            callback();
        });
        connectionMock.authUsers = [credentialsMock.name.toString()];
        await expect(
            sqlConnection.get(
                locationMock,
                [property],
                databaseEntry.identifier
                    ? SqlFactory.createFilter(databaseEntry.identifier)
                    : undefined
            )
        ).rejects.toEqual(new EntryNotFound());
    });
    it('no properties', async () => {
        connectionMock.authUsers = [credentialsMock.name.toString()];
        await expect(
            sqlConnection.get(
                locationMock,
                [],
                databaseEntry.identifier
                    ? SqlFactory.createFilter(databaseEntry.identifier)
                    : undefined
            )
        ).rejects.toEqual(
            new InternalServerError(
                LanguageService.getInstance().translate(ERROR_MESSAGES.PROPERTY_MANDATORY)
            )
        );
    });

    it('success', async () => {
        if (!databaseEntry.object || !otherDatabaseEntry.object) {
            throw new Error();
        }
        const property = new DatabaseEntryProperty(
            Object.keys(databaseEntry.object)[0],
            databaseEntry.object[Object.keys(databaseEntry.object)[0]]
        );
        const otherProperty = new DatabaseEntryProperty(
            Object.keys(otherDatabaseEntry.object)[0],
            databaseEntry.object[Object.keys(otherDatabaseEntry.object)[0]]
        );
        connectionMock.connect = jest.fn((callback: (error?: any) => any) => {
            callback();
        });
        const userGroup = 'myMockGroup';
        //@ts-ignore
        sqlConnection.groups = [userGroup];
        connectionMock.authGroups = [userGroup];
        connectionMock.execSQLImplementation = (request: any, rows: Row[]) => {
            if (
                request.sql ==
                `SELECT [${Object.keys(object)[0]}] FROM [${locationMock.name}] ${
                    databaseEntry.identifier
                        ? SqlFactory.createFilter(databaseEntry.identifier).get()
                        : ''
                }`
            ) {
                const columns = [
                    ...rows,
                    {
                        metadata: {
                            colName: property.name
                        },
                        value:JSON.stringify(property.value)
                    }
                ];
                request.rowListener(columns);
                // Simulate 2nd search hit
                const otherColumns = [
                    ...rows,
                    {
                        metadata: {
                            colName: otherProperty.name
                        },
                        value: JSON.stringify(otherProperty.value)
                    }
                ];
                request.rowListener(otherColumns);
            } else if (rows.length != 0) {
                request.rowListener(rows);
            }
            requestMock.callback(null, 0, []);
        };
        await expect(
            sqlConnection.get(
                locationMock,
                [property],
                databaseEntry.identifier
                    ? SqlFactory.createFilter(databaseEntry.identifier)
                    : undefined
            )
        ).resolves.toEqual(new DatabaseEntry(locationMock, { [property.name]: property.value }));
    });
});

describe('setProperty', () => {
    let property: DatabaseEntryProperty<object>;
    const object: DatabaseEntryObject = {
        attr1: 'val1',
        attr2: 42
    };
    beforeEach(() => {
        property = new DatabaseEntryProperty('mockPropertyName', object);
    });
    it('not authorized', async () => {
        connectionMock.connect = jest.fn((callback: (error?: any) => any) => {
            callback();
        });
        connectionMock.authUsers = ['otherUser'];
        connectionMock.authGroups = ['otherGroup'];
        //@ts-ignore
        sqlConnection.groups = 'mockGroup';
        await expect(sqlConnection.setProperty(property, locationMock)).rejects.toEqual(
            new AuthenticationError('Illegal write access.')
        );
    });
    it('database unreachable', async () => {
        const error = new ReachDatabaseError();
        connectionMock.connect = jest.fn((callback: (error?: any) => any) => {
            callback(error);
        });
        connectionMock.authUsers = [credentialsMock.name.toString()];
        await expect(sqlConnection.setProperty(property, locationMock)).rejects.toBe(error);
    });

    it('success', async () => {
        connectionMock.connect = jest.fn((callback: (error?: any) => any) => {
            callback();
        });
        let correctCall = false;
        connectionMock.execSQLImplementation = (request: any, rows: Row[]) => {
            if (
                request.sql ==
                `UPDATE [${locationMock.name}] SET [${property.name}] = '${JSON.stringify(
                    property.value
                )}'`
            ) {
                correctCall = true;
            }
            if (rows.length != 0) {
                request.rowListener(rows);
            }
            requestMock.callback(null, 0, []);
        };
        connectionMock.authUsers = [credentialsMock.name.toString()];
        await expect(sqlConnection.setProperty(property, locationMock)).resolves.not.toThrow();
        expect(correctCall).toBeTruthy();
    });
});

describe('delete', () => {
    const object: DatabaseEntryObject = {
        attr1: 'val1',
        attr2: 42
    };
    const databaseEntry = new DatabaseEntry(
        { name: 'mockLocation' } as DatabaseLocation,
        object,
        new DatabaseEntryProperty<Identifier>('mockIdentifierName', 'mockIdentifierValue')
    );
    const filter = SqlFactory.createFilter(
        databaseEntry.identifier as DatabaseEntryProperty<Identifier>
    );
    beforeEach(() => {
        if (databaseConfigMock.auth) {
            object[databaseConfigMock.auth?.permission.name] = new SQLAuth(
                new SQLAuthObj(
                    [credentialsMock.name.toString()],
                    databaseConfigMock.auth.groups.default.read
                ),
                new SQLAuthObj(
                    [credentialsMock.name.toString()],
                    databaseConfigMock.auth.groups.default.write
                )
            );
        }
    });
    it('unauthorized', async () => {
        connectionMock.authGroups = ['othergroup'];
        connectionMock.authUsers = ['otheruser'];
        //@ts-ignore
        sqlConnection.groups = ['mockGroup'];
        await expect(sqlConnection.delete(locationMock, filter)).rejects.toStrictEqual(
            new AuthenticationError('Illegal write access.')
        );
    });
    it('database unreachable', async () => {
        const error = new ReachDatabaseError();
        connectionMock.connect = jest.fn((callback: (error?: any) => any) => {
            callback(error);
        });
        connectionMock.authUsers = [credentialsMock.name.toString()];
        await expect(sqlConnection.delete(locationMock, filter)).rejects.toBe(error);
    });
    it('success', async () => {
        connectionMock.authUsers = [credentialsMock.name.toString()];
        connectionMock.connect = jest.fn((callback: (error?: any) => any) => {
            callback();
        });
        let correctCall = false;
        connectionMock.execSQLImplementation = (request: any, rows: Row[]) => {
            if (request.sql == `DELETE FROM [${locationMock.name}] ${filter.get()}`) {
                correctCall = true;
            }
            if (rows.length != 0) request.rowListener(rows);
            requestMock.callback(null, 0, []);
        };
        await expect(sqlConnection.delete(locationMock, filter)).resolves.not.toThrow();
    });
});
