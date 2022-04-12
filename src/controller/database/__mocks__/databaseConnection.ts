import { DatabaseConnection } from '../databaseConnection';

const databaseConnectionMock = jest.createMockFromModule(
    '../databaseConnection'
) as jest.Mocked<DatabaseConnection>;
databaseConnectionMock.create = jest.fn().mockImplementation(() => Promise.resolve());
databaseConnectionMock.get = jest.fn().mockImplementation(() => Promise.resolve(undefined));
databaseConnectionMock.getMany = jest.fn().mockImplementation(() => Promise.resolve(undefined));
databaseConnectionMock.setProperty = jest.fn().mockImplementation(() => Promise.resolve());
databaseConnectionMock.delete = jest.fn().mockImplementation(() => Promise.resolve());

export default databaseConnectionMock;
