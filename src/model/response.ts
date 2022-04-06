/**
 * Response is an interface for the response our server gives the client.
 *
 * @version 1.0
 * @author Gregor Peters
 */
export interface Response {
    app?: any;
    headersSent?: boolean;
    locals?: any;

    body: any;
    statusText: string;
    status: number;
    headers: any;

    append?(): void;

    attachment?(): void;

    cookie?(): void;

    clearCookie?(): void;

    format?(): void;

    send?(body: any): void;
}
