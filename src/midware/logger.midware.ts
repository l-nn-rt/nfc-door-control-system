import {NextFunction, Request, Response} from 'express';

/**
 * Logger Midware to log all api calls coming to the server
 */
export class LoggerMidware {
    /**
     * Logs request
     *
     * @param request the request object from the API call
     * @param response the response object for the API call
     * @param next next function
     */
    public static log(request: Request, response: Response, next: NextFunction) {
        let current_datetime = new Date();
        let formatted_date =
            current_datetime.getFullYear() +
            '-' +
            (current_datetime.getMonth() + 1) +
            '-' +
            current_datetime.getDate() +
            ' ' +
            current_datetime.getHours() +
            ':' +
            current_datetime.getMinutes() +
            ':' +
            current_datetime.getSeconds();
        let method = request.method;
        let url = request.url;
        let log = `[${formatted_date}] ${method}:${url} from ${request.socket.remoteAddress}`;
        console.log(log);
        next();
    }
}
