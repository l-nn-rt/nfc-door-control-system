import { SQLAuth, SQLAuthObj } from '../sqlConnection';
import databaseConfigMock from '../../../model/__mocks__/databaseConfig';

export class Row {
    metadata: {
        colname: string;
    };
    value: string;
    constructor(colname: string, value: string) {
        this.metadata = { colname };
        this.value = value;
    }
}
const _connectionMock = {
    connectCallBack: () => {},
    endCallBack: () => {},
    errorCallBack: () => {},
    userGroups: [] as string[],
    authUsers: [] as string[],
    authGroups: [] as string[],
    password: '',
    execSQLError: null as null | Error,
    connectError: null as null | Error,
    /**
     * Mock implementation of execSQL.
     * If rows.length!=0, you should pass row to request.rowListener.
     * At the end you have to call requestMock.callback.
     * @param request request.
     * @param rows contains results of default calls.
     */
    execSQLImplementation: (request: any, rows: any[]) => {
        if (rows.length != 0) {
            request.rowListener(rows);
        }
        requestMock.callback(connectionMock.execSQLError, 0, []);
    },
    on: jest.fn((event: string, listener: () => void) => {
        switch (event) {
            case 'connect':
                connectionMock.connectCallBack = listener;
                break;
            case 'end':
                connectionMock.endCallBack = listener;
                break;
            case 'error':
                connectionMock.errorCallBack = listener;
                break;
        }
    }),
    connect: jest.fn((callback: (error?: any) => any) => {
        connectionMock.connectCallBack();
        callback(connectionMock.connectError);
    }),
    execSql: jest.fn((request) => {
        const rows = [];
        if (request.sql.includes('SELECT')) {
            if (request.sql.includes(databaseConfigMock.auth?.groups.member.name)) {
                rows.push({
                    metadata: {
                        colName: [databaseConfigMock.auth?.groups.member.name]
                    },
                    value: JSON.stringify(connectionMock.userGroups)
                });
            }
            if (request.sql.includes(databaseConfigMock.auth?.permission.name)) {
                rows.push({
                    metadata: {
                        colName: [databaseConfigMock.auth?.permission.name]
                    },
                    value: JSON.stringify(
                        new SQLAuth(
                            new SQLAuthObj(connectionMock.authUsers, connectionMock.authGroups),
                            new SQLAuthObj(connectionMock.authUsers, connectionMock.authGroups)
                        )
                    )
                });
            }
            if (request.sql.includes(databaseConfigMock.auth?.password.name)) {
                rows.push({
                    metadata: {
                        colName: [databaseConfigMock.auth?.password.name]
                    },
                    value: JSON.stringify(connectionMock.password)
                });
            }
        }

        connectionMock.execSQLImplementation(request, rows);
    })
};

const _requestMock = {
    sql: '',
    callback: (error: Error | null, rowCount: number, rows: any[]) => {},
    rowListener: (columns: any[]) => {},
    on: jest.fn((event: 'row', listener: (columns: any[]) => void) => {
        requestMock.rowListener = listener;
        return this;
    })
};

export var connectionMock: any = {
    ..._connectionMock,
    restore: () => {
        connectionMock = { ..._connectionMock, restore: connectionMock.restore };
    }
};
export var requestMock: any = {
    ..._requestMock,
    restore: () => {
        requestMock = { ..._requestMock, restore: requestMock.restore };
    }
};
