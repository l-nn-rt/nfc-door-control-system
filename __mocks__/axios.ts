/**
 * Global axios mock
 */

const axios = jest.createMockFromModule('axios') as any;
axios.mockReturnValue(
    Promise.resolve({
        data: {msg: 'This is the standard return value of the axios mock'},
        status: 400
    })
);
axios.create = jest.fn();

axios.post = jest.fn();
axios.put = jest.fn();
axios.get = jest.fn();
axios.delete = jest.fn();
export default axios;
