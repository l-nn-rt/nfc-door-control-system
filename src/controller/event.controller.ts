import { ERROR_MESSAGES } from '../res/error.messages';
import { LanguageService } from '../services/language.service';
import { EventSubscriber, Event } from 'shared-utilities';
import { Request, Response } from 'express';

import { HttpService } from '../services/http.service';
import { errorHandling, InternalServerError } from '../model/errors';
import { NotificationController } from './notification.controller';
import { DatabaseService } from '../services/database/database.service';
import { DatabaseFactory } from './database/databaseFactory';
import { MESSAGES } from '../res/messages';

/**
 * The class controls how the bell and doorOpen event is sent and
 * also how EventSubscribers are added, read and deleted.
 *
 * @author Lennart Rak
 * @author Gregor Peters
 * @version 1.0
 */
export class EventController {
    private eventSubscribers: EventSubscriber[] = [];
    private notificationController: NotificationController;
    private readonly databaseFactory: DatabaseFactory;

    public constructor(
        notificationController: NotificationController,
        databaseFactory: DatabaseFactory
    ) {
        this.notificationController = notificationController;
        this.databaseFactory = databaseFactory;
    }

    /**
     * Notifies all {@link EventSubscriber} which matching the event type in the requests body
     *
     * @param request the request object from the API call.
     * Requires body.type as {@link Event}
     * @param response the response object for the API call
     */
    public async notify(request: Request, response: Response): Promise<void> {
        return new Promise(async (resolve) => {
            if ((request.body.type as Event) == Event.BELL_RUNG)
                await this.notificationController.sendNotification(
                    LanguageService.getInstance().translate(MESSAGES.NOTIFICATION_TITLE),
                    LanguageService.getInstance().translate(MESSAGES.BELL_NOTIFICATION_BODY)
                );

            await this.loadEventSubscribers(response).catch(() => {
                resolve();
            });

            const event: Event = request.body.type as Event;

            let passed = 0;
            let max = this.eventSubscribers.length;

            const promises: Promise<any>[] = [];

            for (let i = 0; i < this.eventSubscribers.length; i++) {
                if (this.eventSubscribers[i].event == event) {
                    const endpoint: string = this.eventSubscribers[i].endpoint.toString();

                    promises.push(
                        HttpService.getInstance()
                            .post(endpoint)
                            .then((response) => {
                                if (response.status == 200) {
                                    passed++;
                                }
                            })
                    );
                } else {
                    max--;
                }
            }

            await Promise.all(promises)
                .then(() => {})
                .catch(() => {});

            response.status(200).json({
                msg: `${passed}/${max} got notified`
            });
            resolve();
        });
    }

    /**
     * Deletes the {@link EventSubscriber} with the endpoint given in the requests body from the database
     *
     * @param request the request object from the API call.
     * Requires body.endpoint to know which {@link EventSubscriber} should be deleted
     * @param response the response object for the API call
     */
    public async deleteEventSubscriber(request: Request, response: Response): Promise<void> {
        return new Promise(async (resolve) => {
            const eventSubscriber: EventSubscriber = new EventSubscriber(
                request.body.endpoint,
                Event.BELL_RUNG,
                ''
            );

            await this.loadEventSubscribers(response).catch(() => {
                resolve();
            });

            try {
                DatabaseService.getInstance()
                    .deleteEventSubscriber(eventSubscriber, response.locals.databaseConnection)
                    .then(() => {
                        this.eventSubscribers = this.eventSubscribers.filter((value) => {
                            return value.endpoint != eventSubscriber.endpoint;
                        });

                        response.status(200).json({ msg: 'Successfully deleted eventSubscriber' });
                        resolve();
                    })
                    .catch((error) => {
                        errorHandling(error, response);
                        resolve();
                    });
            } catch (error) {
                errorHandling(error, response);
                resolve();
            }
        });
    }

    /**
     * Puts a list of all {@link EventSubscriber} in the response
     *
     * @param request the request object from the API call
     * @param response the response object for the API call
     */
    public async getAll(request: Request, response: Response): Promise<void> {
        return new Promise((resolve) => {
            this.loadEventSubscribers(response)
                .then(() => {
                    const value: object[] = [];

                    this.eventSubscribers.forEach((eventSubscriber: EventSubscriber) => {
                        value.push(EventSubscriber.toJSON(eventSubscriber));
                    });

                    response.status(200).json({
                        eventSubscribers: value
                    });
                    resolve();
                })
                .catch(() => {
                    resolve();
                });
        });
    }

    /**
     * Adds the {@link EventSubscriber} given in the requests body to the database
     *
     * @param request the request object from the API call.
     * Requires body.endpoint, body.type, body.label to create the {@link EventSubscriber}
     * @param response the response object for the API call
     */
    public async addEventSubscriber(request: Request, response: Response): Promise<void> {
        return new Promise((resolve) => {
            const eventSubscriber: EventSubscriber = new EventSubscriber(
                request.body.endpoint,
                request.body.type,
                request.body.label
            );
            try {
                DatabaseService.getInstance()
                    .addEventSubscriber(eventSubscriber, response.locals.databaseConnection)
                    .then(() => {
                        this.eventSubscribers.push(eventSubscriber);
                        response.status(200).json({ msg: 'Successfully added eventSubscriber' });
                        resolve();
                    })
                    .catch((error) => {
                        errorHandling(error, response);
                        resolve();
                    });
            } catch (error) {
                errorHandling(error, response);
                resolve();
            }
        });
    }

    private async loadEventSubscribers(response: Response): Promise<void> {
        return new Promise((resolve, reject) => {
            this.databaseFactory
                .createMidwareConnection()
                .then((dbCon) => {
                    try {
                        DatabaseService.getInstance()
                            .getAllEventSubscriber(dbCon)
                            .then((value) => {
                                this.eventSubscribers = value;
                                resolve();
                            })
                            .catch(() => {
                                errorHandling(
                                    new InternalServerError(
                                        LanguageService.getInstance().translate(
                                            ERROR_MESSAGES.ENTRY_NOT_FOUND
                                        )
                                    ),
                                    response
                                );
                                reject();
                            });
                    } catch (error) {
                        errorHandling(error, response);
                        reject();
                    }
                })
                .catch((error) => {
                    errorHandling(error, response);
                    reject();
                });
        });
    }
}
