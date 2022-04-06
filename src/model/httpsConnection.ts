import { Url } from 'shared-utilities';
import { Response } from 'src/model/response';

export interface HttpsConnection {
    /**
     * Https-Method get
     * @param url Url.
     * @param config Request config.
     */
    get(url: Url, config: any): Promise<Response>;

    /**
     * Https-Method post
     * @param url Url.
     * @param config Request config.
     * @param data: Request data.
     */
    post(url: Url, config: any, data: any): Promise<Response>;

    /**
     * Https-Method put
     * @param url Url.
     * @param config Request config.
     * @param data: Request data.
     */
    put(url: Url, config: any, data: any): Promise<Response>;

    /**
     * Https-Method delete
     * @param url Url.
     * @param config Request config.
     */
    delete(url: Url, config: any): Promise<Response>;
}
