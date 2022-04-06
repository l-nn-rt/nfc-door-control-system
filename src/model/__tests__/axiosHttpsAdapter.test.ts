import axios from "../../../__mocks__/axios";
import {AxiosRequestConfig} from "axios";
import {AxiosHttpsAdapter} from "../axiosHttpsAdapter";

jest.mock('axios');

let axiosHttpsAdapter: AxiosHttpsAdapter = new AxiosHttpsAdapter(axios);


beforeAll(() => {
});

beforeEach(() => {
    axiosHttpsAdapter = new AxiosHttpsAdapter(axios);
});

describe("get", () => {
    test("success", async () => {
        axios.get.mockImplementationOnce((url: string, config: AxiosRequestConfig) => {
            return Promise.resolve({
                data: {},
                status: 200,
                statusText: "",
                headers: {}
            });
        });
        const response = await axiosHttpsAdapter.get("", {});
        expect(response.status).toBe(200);
    });
    test("failure", async () => {
        const message = "test";
        const error = new Error(message);
        axios.get.mockRejectedValueOnce(error);
        await expect(axiosHttpsAdapter.get("", {})).rejects.toThrow(message);
    });
});

describe("put", () => {
    test("success", async () => {
        axios.put.mockImplementationOnce((url: string, config: AxiosRequestConfig) => {
            return Promise.resolve({
                data: {},
                status: 200,
                statusText: "",
                headers: {}
            });
        });
        const response = await axiosHttpsAdapter.put("", {}, {});
        expect(response.status).toBe(200);
    });
    test("failure", async () => {
        const message = "test";
        const error = new Error(message);
        axios.put.mockRejectedValueOnce(error);
        await expect(axiosHttpsAdapter.put("", {}, {})).rejects.toThrow(message);
    });
});

describe("delete ", () => {
    test("success", async () => {
        axios.delete.mockImplementationOnce((url: string, config: AxiosRequestConfig) => {
            return Promise.resolve({
                data: {},
                status: 200,
                statusText: "",
                headers: {}
            });
        });
        const response = await axiosHttpsAdapter.delete("", {});
        expect(response.status).toBe(200);
    });
    test("failure", async () => {
        const message = "test";
        const error = new Error(message);
        axios.delete.mockRejectedValueOnce(error);
        await expect(axiosHttpsAdapter.delete("", {})).rejects.toThrow(message);
    });
});

describe("post", () => {
    test("success", async () => {
        axios.post.mockImplementationOnce((url: string, config: AxiosRequestConfig) => {
            return Promise.resolve({
                data: {},
                status: 200,
                statusText: "",
                headers: {}
            });
        });
        const response = await axiosHttpsAdapter.post("", {}, {});
        expect(response.status).toBe(200);
    });
    test("failure", async () => {
        const message = "test";
        const error = new Error(message);
        axios.post.mockRejectedValueOnce(error);
        await expect(axiosHttpsAdapter.post("", {}, {})).rejects.toThrow(message);
    });
});

