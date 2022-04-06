import {Url} from 'shared-utilities';
import {Axios, AxiosRequestConfig} from 'axios';
import {HttpsConnection} from './httpsConnection';
import {Response} from 'src/model/response';

/**
 * This class is an adapter from Axios to {@link HttpsConnection}.
 */
export class AxiosHttpsAdapter implements HttpsConnection {
    private readonly _httpsConnection: Axios;

    constructor(httpsConnection: Axios) {
        this._httpsConnection = httpsConnection;
    }

    get(url: Url, config: AxiosRequestConfig): Promise<Response> {
        return new Promise((resolve, reject) => {
            this._httpsConnection
                .get(url.toString(), config)
                .then((axiosResponse) => {
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

    post(url: Url, config: AxiosRequestConfig, data: any): Promise<Response> {
        return new Promise((resolve, reject) => {
            this._httpsConnection
                .post(url.toString(), data, config)
                .then((axiosResponse) => {
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

    put(url: Url, config: AxiosRequestConfig, data: any): Promise<Response> {
        return new Promise((resolve, reject) => {
            this._httpsConnection
                .put(url.toString(), data, config)
                .then((axiosResponse) => {
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

    delete(url: Url, config: AxiosRequestConfig): Promise<Response> {
        return new Promise((resolve, reject) => {
            this._httpsConnection
                .delete(url.toString(), config)
                .then((axiosResponse) => {
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
