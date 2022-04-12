import { DatabaseFactory } from '../databaseFactory';
import databaseConnection from './databaseConnection';
import { DatabaseService } from '../../../services/database/database.service';
import { DatabaseCredentials } from '../../../model/database/databaseCredentials';
import databaseServiceMock from '../../../services/database/__mocks__/database.service.mock';
import { DatabaseConnection } from '../databaseConnection';
import { Identifier } from 'shared-utilities';
import { DatabaseFilter } from '../../../model/database/databaseFilter';
import { DatabaseEntryProperty } from '../../../model/database/databaseEntryProperty';
import { DatabaseConfig } from '../../../model/databaseConfig';

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
