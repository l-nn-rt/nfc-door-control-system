import {DoorController} from '../door.controller';

const doorControllerMock = jest.createMockFromModule(
    '../door.controller'
) as jest.Mocked<DoorController>;

doorControllerMock.open = jest.fn();
doorControllerMock.deleteNfcToken = jest.fn();
doorControllerMock.setDoorMicrocontroller = jest.fn();
doorControllerMock.updateDoorControllerViaRequest = jest.fn();
doorControllerMock.updateNfcToken = jest.fn();

export default doorControllerMock;
