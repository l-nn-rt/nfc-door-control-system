import {HttpService} from "../http.service";


const httpServiceMock = jest.createMockFromModule(
    '../http.service'
) as jest.Mocked<HttpService>;

httpServiceMock.getConnection = jest.fn();
httpServiceMock.get = jest.fn();
httpServiceMock.post = jest.fn();
httpServiceMock.put = jest.fn();
httpServiceMock.delete = jest.fn();

export default httpServiceMock;