import { Microcontroller } from '../microcontroller';

const microcontrollerMock = jest.createMockFromModule(
    '../microcontroller'
) as jest.Mocked<Microcontroller>;
export default microcontrollerMock;
