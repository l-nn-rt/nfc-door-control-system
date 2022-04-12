import {DatabaseService} from '../database.service';
import {DatabaseConnection} from "../../../controller/database/databaseConnection";

const databaseServiceMock = jest.createMockFromModule(
    '../database.service'
) as jest.Mocked<DatabaseService>;

databaseServiceMock.setDoor = jest.fn();
databaseServiceMock.getAllUserNames = jest.fn();
databaseServiceMock.getAllUserNames = jest.fn();
databaseServiceMock.getAllNfcTokens = jest.fn();
databaseServiceMock.getNfcToken = jest.fn();
databaseServiceMock.setNfcToken = jest.fn();
databaseServiceMock.getAllEventSubscriber = jest.fn((databaseConnection: DatabaseConnection) => {
    console.log("please overwrite implementation");
    return Promise.reject();
});
databaseServiceMock.addEventSubscriber = jest.fn();
databaseServiceMock.deleteEventSubscriber = jest.fn();
export default databaseServiceMock;
