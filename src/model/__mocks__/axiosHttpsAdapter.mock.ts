import {AxiosHttpsAdapter} from "../axiosHttpsAdapter";

const axiosHttpsAdapterMock = jest.createMockFromModule(
    '../axiosHttpsAdapter'
) as jest.Mocked<AxiosHttpsAdapter>;

axiosHttpsAdapterMock.post = jest.fn();
axiosHttpsAdapterMock.get = jest.fn();
axiosHttpsAdapterMock.delete = jest.fn();
axiosHttpsAdapterMock.put = jest.fn();


export default axiosHttpsAdapterMock;
