import { DoorSingleton } from '../doorSingleton.model';
import microcontrollerMock from './microcontroller';

const doorSingletonMock = jest.createMockFromModule(
    '../doorSingleton.model'
) as jest.Mocked<DoorSingleton>;

//@ts-ignore
doorSingletonMock.microcontroller = microcontrollerMock;
/*jest.requireActual('../doorSingleton.model').getInstance = jest.fn(
    (endpoint?: Url, psk?: Hash, seed?: Hash) => {
        return doorSingletonMock;
    }
);//*/

export default doorSingletonMock;
