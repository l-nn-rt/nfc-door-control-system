import { DatabaseFactory } from '../databaseFactory';
import databaseConnection from '../../database/__mocks__/databaseConnection';
import { DatabaseService } from '../database.service';
import { DatabaseCredentials } from '../databaseCredentials';
import databaseServiceMock from './database.service.mock';
import { DatabaseConnection } from '../databaseConnection';
import { Identifier } from 'shared-utilities';
import { DatabaseFilter } from '../databaseFilter';
import { DatabaseEntryProperty } from '../databaseEntryProperty';
import { DatabaseConfig } from '../../model/databaseConfig';

const databaseFactoryMock = jest.createMockFromModule(
    '../databaseFactory'
) as jest.Mocked<DatabaseFactory>;

const createService = jest.fn().mockImplementation((config: DatabaseConfig) => {
    return databaseServiceMock as DatabaseService;
});
const createConnection = jest.fn().mockImplementation((credentials: DatabaseCredentials) => {
    return new Promise((resolve, reject) => {
        resolve(databaseConnection as DatabaseConnection);
    });
});
const createMidwareConnection = jest.fn().mockImplementation(() => {
    return databaseFactoryMock.createConnection(
        new DatabaseCredentials('mockUsername', 'mockPassword')
    );
});
const createFilter = jest.fn().mockImplementation((property: DatabaseEntryProperty<Identifier>) => {
    const ret: any = {
        ident: `name:${property.name}val:${property.value}`,
        get: jest.fn(() => {
            return ret.ident;
        })
    };
    return ret as DatabaseFilter;
});
databaseFactoryMock.createService = createService;
databaseFactoryMock.createConnection = createConnection;
databaseFactoryMock.createFilter = createFilter;

databaseFactoryMock.createMidwareConnection = createMidwareConnection;
export default databaseFactoryMock;
