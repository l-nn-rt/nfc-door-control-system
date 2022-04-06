import {
    CallBack,
    Change,
    Error, ErrorCallback,
    SearchCallBack,
    SearchCallbackResponse,
    SearchOptions,
} from "ldapjs";
import databaseConfigMock from "../src/model/__mocks__/databaseConfig";


const client = {
    errorListener: () => {
    },
    connectListener: () => {
    },
    on: jest.fn().mockImplementation((event: string | symbol, listener: (...args: any[]) => void) => {
        switch (event) {
            case "connect":
                client.connectListener = listener;
                break;
            case "error":
                client.errorListener = listener;
                break;
            default:
                break;
        }
    }),
    bind: jest.fn().mockImplementation((dn: string, password: string, callback: CallBack) => {
        if (dn == databaseConfigMock.midware.credentials.name &&
            password == databaseConfigMock.midware.credentials.password) {
            return callback(null);
        } else {
            return callback({} as Error);
        }
    }),
    searchEntryListenerTimes: 0,
    endListenerTimes: 0,
    errorListenerTimes: 0,
    searchError: null,
    search: jest.fn().mockImplementation((base: string, options: SearchOptions, callback: SearchCallBack) => {
        const searchCallbackResponse = {
            on: (event: string | symbol, listener: (...args: any[]) => void) => {
                switch (event) {
                    case "searchEntry":
                        for (let i = 0; i < client.searchEntryListenerTimes; i++)
                            listener({
                                dn: "blup", object: {
                                    dn: "blup2",
                                    [databaseConfigMock.user.nfcToken.name]: "hallo"
                                }
                            });
                        break;
                    case "error":
                        for (let i = 0; i < client.errorListenerTimes; i++)
                            listener({code: 12, name: "lennart", message: "i like errors"} as Error);
                        break;
                    case "end":
                        for (let i = 0; i < client.endListenerTimes; i++)
                            listener();
                        break;
                    default:
                        break;
                }
                return searchCallbackResponse;
            }
        } as SearchCallbackResponse
        callback(client.searchError, searchCallbackResponse);
    }),
    modify: jest.fn().mockImplementation((name: string, change: Change | Array<Change>, callback: ErrorCallback) => {
        // @ts-ignore
        return callback(undefined);
    }),
    del: jest.fn().mockImplementation((name: string, callback: ErrorCallback) => {
        // @ts-ignore
        return callback(undefined);
    }),
    add: jest.fn().mockImplementation((name: string, entry: Object, callback: ErrorCallback) => {
        // @ts-ignore
        return callback(undefined);
    })
};

const ldap = jest.createMockFromModule('ldapjs') as any;

ldap.createClient = jest.fn().mockImplementation(() => {
    return client;
});


export default ldap;

