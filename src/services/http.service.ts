import { AxiosHttpsAdapter } from '../model/axiosHttpsAdapter';
import { HttpsConnection } from '../model/httpsConnection';
import { HttpMethod, Url } from 'shared-utilities';
import { Agent } from 'https';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Response } from '../model/response';

export class HttpService {
    private static instance: HttpService;
    private static readonly defaultTimeout = 1000 * 60 * 5;
    private constructor() {}

    public static getInstance(): HttpService {
        if (!this.instance) {
            this.instance = new HttpService();
        }
        return this.instance;
    }

    public getConnection(
        url: Url,
        headers?: Record<string, string>,
        timeout?: number
    ): HttpsConnection | undefined {
        const httpsAgent = new Agent({
            rejectUnauthorized: false,
            keepAlive: true
        });
        const connection = axios.create({
            url: url.toString(),
            httpsAgent: httpsAgent,
            timeout: timeout ? timeout : HttpService.defaultTimeout,
            headers: headers
        });
        if (!connection) return undefined;
        return new AxiosHttpsAdapter(connection);
    }

    /**
     * get
     */
    public async get(
        url: string,
        headers?: Record<string, string>,
        connection?: HttpsConnection
    ): Promise<Response> {
        return this.performRequest(HttpMethod.GET, url, connection, undefined, headers);
    }

    /**
     * post
     *
     */
    public async post(
        url: string,
        body?: object,
        headers?: Record<string, string>,
        connection?: HttpsConnection
    ): Promise<Response> {
        return this.performRequest(HttpMethod.POST, url, connection, body, headers);
    }

    /**
     * put
     */
    public async put(
        url: string,
        body: object,
        headers?: Record<string, string>,
        connection?: HttpsConnection
    ): Promise<Response> {
        return this.performRequest(HttpMethod.PUT, url, connection, body, headers);
    }

    /**
     * delete
     */
    public async delete(
        url: string,
        body: object,
        headers?: Record<string, string>,
        connection?: HttpsConnection
    ): Promise<Response> {
        return this.performRequest(HttpMethod.DELETE, url, connection, body, headers);
    }

    private async performRequest(
        method: HttpMethod,
        url: string,
        connection?: HttpsConnection,
        body?: object,
        headers?: Record<string, string>,
        timeout?: number
    ): Promise<Response> {
        //Configure
        const httpsAgent = new Agent({
            rejectUnauthorized: false
        });
        const requestConfig: AxiosRequestConfig = {};

        requestConfig.timeout = timeout ? timeout : HttpService.defaultTimeout;
        requestConfig.url = url;

        if (body) {
            requestConfig.data = body;
        }
        if (headers) {
            requestConfig.headers = headers;
        }
        if (connection) {
            switch (method) {
                case HttpMethod.GET:
                    return connection.get(url, requestConfig);
                case HttpMethod.POST:
                    return connection.post(url, requestConfig, body);
                case HttpMethod.PUT:
                    return connection.put(url, requestConfig, body);
                case HttpMethod.DELETE:
                    return connection.delete(url, requestConfig);
            }
        }
        requestConfig.httpsAgent = httpsAgent;
        switch (method) {
            case HttpMethod.GET:
                requestConfig.method = 'get';
                break;
            case HttpMethod.POST:
                requestConfig.method = 'post';
                break;
            case HttpMethod.PUT:
                requestConfig.method = 'put';
                break;
            case HttpMethod.DELETE:
                requestConfig.method = 'delete';
                break;
        }

        axios.create(requestConfig);
        return new Promise((resolve, reject) => {
            axios(requestConfig)
                .then((axiosResponse: AxiosResponse) => {
                    const response: Response = {
                        body: axiosResponse.data,
                        status: axiosResponse.status,
                        statusText: axiosResponse.statusText,
                        headers: axiosResponse.headers
                    };
                    resolve(response);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }
}
