import {Event, VideoQuality} from 'shared-utilities';
import {NextFunction, Request, Response} from 'express';
import Validator, {Rules} from 'validatorjs';
import {MissingInput} from "../model/errors";

/**
 * Validates incoming requests and manages error handling.
 *
 * @author Lennart Rak
 * @version 1.0
 */
export class ValidationMidware {
    private static validate(
        request: Request,
        response: Response,
        next: NextFunction,
        validationRules: Rules,
        statusCode: number
    ) {
        this.useValidator(request.body, validationRules, (error: object) => {
            if (error) {
                response.status(statusCode).json(error);
            } else {
                next();
            }
        });
    }

    private static useValidator(data: any, rules: Rules, callback: (error: any) => void): void {
        const validator = new Validator(data, rules, {});
        validator.passes(() => callback(null));
        validator.fails(() => callback(validator.errors));
    }

    /**
     * Checks if all necessary attributes for an event are set and valid
     *
     * @param request the request object from the API call
     * @param response the response object for the API call
     * @param next next function
     */
    public static validateEvent(request: Request, response: Response, next: NextFunction) {
        let values: string[] = Object.keys(Event);

        const validationRule = {
            type: ['required', `regex:${ValidationMidware.getRegex(values)}`]
        };

        ValidationMidware.validate(request, response, next, validationRule, new MissingInput("").statusCode);
    }

    /**
     * Checks if all necessary attributes for the quality are set and valid
     *
     * @param request the request object from the API call
     * @param response the response object for the API call
     * @param next next function
     */
    public static validateQuality(request: Request, response: Response, next: NextFunction) {
        let values: string[] = Object.keys(VideoQuality);

        const validationRule = {
            quality: ['required', `regex:${ValidationMidware.getRegex(values)}`]
        };

        //console.log(request.query);

        ValidationMidware.useValidator(request.query, validationRule, (error: object) => {
            if (error) {
                response.status(new MissingInput("").statusCode).json(error);
            } else {
                next();
            }
        });
    }

    private static getRegex(values: string[]): string {
        let regex = '(';
        for (let i = 0; i < values.length; i++) {
            regex += values[i];

            if (i < values.length - 1) {
                regex += '|';
            }
        }
        regex += ')';

        return regex;
    }

    /**
     * Checks if all necessary attributes for an event subscriber are set and valid
     *
     * @param request the request object from the API call
     * @param response the response object for the API call
     * @param next next function
     */
    public static validateEventSubscriber(
        request: Request,
        response: Response,
        next: NextFunction
    ) {
        const validationRule = {
            endpoint: ['required']
        };

        ValidationMidware.validate(request, response, next, validationRule, new MissingInput("").statusCode);
    }

    /**
     * Checks if all necessary attributes for door log in are set and valid
     *
     * @param request the request object from the API call
     * @param response the response object for the API call
     * @param next next function
     */
    public static validateUserLogin(request: Request, response: Response, next: NextFunction) {
        const validationRule = {
            username: ['required'],
            password: ['required']
        };

        ValidationMidware.validate(request, response, next, validationRule, new MissingInput("").statusCode);
    }

    /**
     * Checks if all necessary attributes for a username are set and valid
     *
     * @param request the request object from the API call
     * @param response the response object for the API call
     * @param next next function
     */
    public static validateUsername(request: Request, response: Response, next: NextFunction) {
        const validationRule = {
            username: ['required']
        };

        ValidationMidware.validate(request, response, next, validationRule, new MissingInput("").statusCode);
    }

    /**
     * Checks if all necessary attributes for a nfc token are set and valid
     *
     * @param request the request object from the API call
     * @param response the response object for the API call
     * @param next next function
     */
    public static validateNfcToken(request: Request, response: Response, next: NextFunction) {
        const validationRule = {
            nfcToken: ['required']
        };

        ValidationMidware.validate(request, response, next, validationRule, new MissingInput("").statusCode);
    }

    /**
     * Checks if all necessary attributes for door log in are set and valid
     *
     * @param request the request object from the API call
     * @param response the response object for the API call
     * @param next next function
     */
    public static validateDoorLogin(request: Request, response: Response, next: NextFunction) {
        const validationRule = {
            url: ['required']
        };

        ValidationMidware.validate(request, response, next, validationRule, new MissingInput("").statusCode);
    }

    /**
     * Checks if all necessary attributes for a web push notification subscriber are set and valid
     * @param request the request object from the API call
     * @param response the response object for the API call
     * @param next next function
     */
    public static validateSubscription(request: Request, response: Response, next: NextFunction) {
        const validationRule = {
            endpoint: ['required'],
            'keys.auth': ['required'],
            'keys.p256dh': ['required']
        };

        ValidationMidware.validate(request, response, next, validationRule, new MissingInput("").statusCode);
    }
}
