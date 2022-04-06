import axios from "../../../__mocks__/axios";
import {HttpService} from "../http.service";
import axiosHttpsAdapterMock from "../../model/__mocks__/axiosHttpsAdapter.mock";
import {AxiosRequestConfig} from "axios";
import {AxiosHttpsAdapter} from "../../model/axiosHttpsAdapter";
import {Url} from "shared-utilities";

jest.mock('axios');
jest.mock('../../model/axiosHttpsAdapter');

const httpService: HttpService = HttpService.getInstance();
const axiosHttpsAdapter = AxiosHttpsAdapter as jest.MockedClass<typeof AxiosHttpsAdapter>;
axiosHttpsAdapter.mockImplementation((httpsConnection: typeof axios) => {
    return axiosHttpsAdapterMock;
});

beforeAll(() => {
});

beforeEach(() => {

});

describe("get", () => {
    test("success", async () => {
        axios.mockResolvedValueOnce({data: {}, status: 200, statusText: "", headers: {}});
        const response = await httpService.get("");
        expect(response.status).toBe(200);
    });
    test("success with header", async () => {
        axios.mockImplementationOnce((config: AxiosRequestConfig) => {
            const headers = config.headers;
            return Promise.resolve({
                data: {},
                status: 200,
                statusText: "",
                headers: headers
            });
        });
        const headers = {"test": "test"}
        const response = await httpService.get("", headers);
        expect(response.status).toBe(200);
        expect(response.headers).toBe(headers);
    });
    test("success with connection", async () => {
        axiosHttpsAdapterMock.get.mockImplementationOnce((url: Url, config: any) => {
            const headers = config.headers;
            return Promise.resolve({
                body: {},
                status: 200,
                statusText: "",
                headers: headers
            } as Response);
        });
        const headers = {"test": "test"}
        const response = await httpService.get("", headers, axiosHttpsAdapterMock);
        expect(response.status).toBe(200);
        expect(response.headers).toBe(headers);
    });

});

describe("getConnection", () => {
    test("success", () => {
        axios.create.mockImplementationOnce((config: AxiosRequestConfig) => {
            return axios;
        });

        const connection = httpService.getConnection("");
        expect(connection).toBe(axiosHttpsAdapterMock);
    });
    test("failure", () => {
        axios.create.mockImplementationOnce((config: AxiosRequestConfig) => {
            return undefined;
        });

        const connection = httpService.getConnection("");
        expect(connection).toBe(undefined);
    });
});

describe("put", () => {
    test("success", async () => {
        axios.mockResolvedValueOnce({data: {}, status: 200, statusText: "", headers: {}});
        const response = await httpService.put("", {});
        expect(response.status).toBe(200);
    });
    test("success with header", async () => {
        axios.mockImplementationOnce((config: AxiosRequestConfig) => {
            const headers = config.headers;
            return Promise.resolve({
                data: {},
                status: 200,
                statusText: "",
                headers: headers
            });
        });
        const headers = {"test": "test"}
        const response = await httpService.put("", {}, headers);
        expect(response.status).toBe(200);
        expect(response.headers).toBe(headers);
    });
    test("success with body", async () => {
        axios.mockImplementationOnce((config: AxiosRequestConfig) => {
            const body = config.data;
            return Promise.resolve({
                data: body,
                status: 200,
                statusText: "",
                headers: {}
            });
        });
        const body = {"test": "test"}
        const response = await httpService.put("", body);
        expect(response.status).toBe(200);
        expect(response.body).toBe(body);
    });
    test("success with connection", async () => {
        axiosHttpsAdapterMock.put.mockImplementationOnce((url: Url, config: any) => {
            const headers = config.headers;
            return Promise.resolve({
                body: {},
                status: 200,
                statusText: "",
                headers: headers
            } as Response);
        });
        const headers = {"test": "test"}
        const response = await httpService.put("", {}, headers, axiosHttpsAdapterMock);
        expect(response.status).toBe(200);
        expect(response.headers).toBe(headers);
    });
});

describe("delete ", () => {
    test("success", async () => {
        axios.mockResolvedValueOnce({data: {}, status: 200, statusText: "", headers: {}});
        const response = await httpService.delete("", {});
        expect(response.status).toBe(200);
    });
    test("success with header", async () => {
        axios.mockImplementationOnce((config: AxiosRequestConfig) => {
            const headers = config.headers;
            return Promise.resolve({
                data: {},
                status: 200,
                statusText: "",
                headers: headers
            });
        });
        const headers = {"test": "test"}
        const response = await httpService.delete("", {}, headers);
        expect(response.status).toBe(200);
        expect(response.headers).toBe(headers);
    });
    test("success with body", async () => {
        axios.mockImplementationOnce((config: AxiosRequestConfig) => {
            const body = config.data;
            return Promise.resolve({
                data: body,
                status: 200,
                statusText: "",
                headers: {}
            });
        });
        const body = {"test": "test"}
        const response = await httpService.delete("", body);
        expect(response.status).toBe(200);
        expect(response.body).toBe(body);
    });
    test("success with connection", async () => {
        axiosHttpsAdapterMock.delete.mockImplementationOnce((url: Url, config: any) => {
            const headers = config.headers;
            return Promise.resolve({
                body: {},
                status: 200,
                statusText: "",
                headers: headers
            } as Response);
        });
        const headers = {"test": "test"}
        const response = await httpService.delete("", {}, headers, axiosHttpsAdapterMock);
        expect(response.status).toBe(200);
        expect(response.headers).toBe(headers);
    });
});

describe("post", () => {
    test("success", async () => {
        axios.mockResolvedValueOnce({data: {}, status: 200, statusText: "", headers: {}});
        const response = await httpService.post("", {});
        expect(response.status).toBe(200);
    });
    test("success with header", async () => {
        axios.mockImplementationOnce((config: AxiosRequestConfig) => {
            const headers = config.headers;
            return Promise.resolve({
                data: {},
                status: 200,
                statusText: "",
                headers: headers
            });
        });
        const headers = {"test": "test"}
        const response = await httpService.post("", {}, headers);
        expect(response.status).toBe(200);
        expect(response.headers).toBe(headers);
    });
    test("success with body", async () => {
        axios.mockImplementationOnce((config: AxiosRequestConfig) => {
            const body = config.data;
            return Promise.resolve({
                data: body,
                status: 200,
                statusText: "",
                headers: {}
            });
        });
        const body = {"test": "test"}
        const response = await httpService.post("", body);
        expect(response.status).toBe(200);
        expect(response.body).toBe(body);
    });
    test("success with connection", async () => {
        axiosHttpsAdapterMock.post.mockImplementationOnce((url: Url, config: any) => {
            const headers = config.headers;
            return Promise.resolve({
                body: {},
                status: 200,
                statusText: "",
                headers: headers
            } as Response);
        });
        const headers = {"test": "test"}
        const response = await httpService.post("", {}, headers, axiosHttpsAdapterMock);
        expect(response.status).toBe(200);
        expect(response.headers).toBe(headers);
    });
    test("failure", async () => {
        const message = "test";
        const error = new Error(message);
        axios.mockRejectedValueOnce(error);
        await expect(httpService.post("", {})).rejects.toThrow(message);
    });
});

