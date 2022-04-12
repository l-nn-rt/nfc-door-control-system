import { DoorConnectError } from './../model/errors';
import { SessionMidware } from '../midware/session.midware';
import { Request, Response } from 'express';
import { NfcToken, Username } from 'shared-utilities';

import { User } from '../model/user.model';
import {
    ReachDatabaseError,
    errorHandling,
    InternalServerError,
    InvalidCredentialsError,
    UnknownError
} from '../model/errors';
import { DatabaseCredentials } from '../model/database/databaseCredentials';
import { DoorController } from './door.controller';
import { ERROR_MESSAGES } from '../res/error.messages';
import { LanguageService } from '../services/language.service';
import { DatabaseService } from '../services/database/database.service';
import { DatabaseFactory } from './database/databaseFactory';

const crypto = require('crypto');

/**
 * The class controls how the user is logged in and out, how the {@link NfcToken} is set and deleted.
 *
 * @author Lennart Rak, Gregor Peters
 * @version 1.0
 */
export class UserController {
    private usernames: Username[] = [];
    private nfcTokens: NfcToken[] = [];
    private doorController: DoorController;

    private readonly sessionMaxAge: number;

    private readonly databaseFactory: DatabaseFactory;

    /**
     * Creates new {@link UserController}
     *
     * @param doorController the {@link DoorController} the {@link UserController} should use
     * @param sessionMaxAge the maximum age the session should have
     * @param databaseFactory
     */
    public constructor(
        doorController: DoorController,
        sessionMaxAge: number,
        databaseFactory: DatabaseFactory
    ) {
        this.sessionMaxAge = sessionMaxAge;
        this.doorController = doorController;
        this.databaseFactory = databaseFactory;
    }

    /**
     * Logs in the {@link User} and sets up the session cookie
     *
     * @param request the request object from the API call.
     * Requires body.username and body.password
     * @param response the response object for the API call
     */
    public async login(request: Request, response: Response): Promise<void> {
        return new Promise((resolve) => {
            this.databaseFactory
                .createConnection(
                    new DatabaseCredentials(request.body.username, request.body.password)
                )
                .then((value) => {
                    if (value) {
                        request.session.validUntil = Date.now() + this.sessionMaxAge;
                        request.session.username = request.body.username;
                        response.status(200).json({});
                        return resolve();
                    } else {
                        errorHandling(new InvalidCredentialsError(), response);
                        return resolve();
                    }
                })
                .catch((error: ReachDatabaseError) => {
                    errorHandling(error, response);
                    return resolve();
                });
        });
    }

    /**
     * Gets the username stored in the session or an empty body otherwise
     *
     * @param request the request object from the API call
     * @param response the response object for the API call
     */
    public async getUsername(request: Request, response: Response): Promise<void> {
        return new Promise((resolve) => {
            let sessionMidware = new SessionMidware((response: Response) => {
                response.status(200).json({});
            });
            sessionMidware
                .validateSession(request, response, () => {
                    response.status(200).json({ username: request.session.username });
                })
                .then(() => {
                    resolve();
                });
        });
    }

    /**
     * Logs out the {@link User} by invalidating the session
     *
     * @param request the request object from the API call
     * @param response the response object for the API call
     */
    public async logout(request: Request, response: Response): Promise<void> {
        try {
            request.session.validUntil = 0;
            response.status(200).json({});
        } catch (error) {
            errorHandling(error, response);
        }
    }

    /**
     * Sets the {@link NfcToken} of the {@link User}
     *
     * @param request the request object from the API call.
     * Requires body.nfcToken and params identifier
     * @param response the response object for the API call
     */

    public async setNfcToken(request: Request, response: Response): Promise<void> {
        return new Promise(async (resolve) => {
            const user: User = new User(request.params.identifier);
            user.nfcToken = this.seedNfcToken(request.body.nfcToken);

            try {
                const oldNfcToken = await DatabaseService.getInstance()
                    .getNfcToken(user, response.locals.databaseConnection)
                    .catch(() => {});

                DatabaseService.getInstance()
                    .setNfcToken(user, response.locals.databaseConnection)
                    .then(() => {
                        //update door
                        //update this.nfcTokens
                        if (oldNfcToken) {
                            for (let i = 0; i < this.nfcTokens.length; i++) {
                                if (
                                    user.nfcToken &&
                                    JSON.stringify(this.nfcTokens[i]) == JSON.stringify(oldNfcToken)
                                ) {
                                    this.nfcTokens[i] = user.nfcToken;
                                }
                            }
                        } else {
                            this.nfcTokens.push(<NfcToken>user.nfcToken);
                        }

                        this.doorController
                            .updateNfcToken(
                                [<NfcToken>user.nfcToken],
                                oldNfcToken ? oldNfcToken : undefined
                            )
                            .then(() => {
                                response.status(200);
                                response.json({
                                    username: user.username,
                                    nfcToken: user.nfcToken
                                });
                                resolve();
                            })
                            .catch(() => {
                                errorHandling(
                                    new DoorConnectError({
                                        username: user.username,
                                        nfcToken: user.nfcToken
                                    }),
                                    response
                                );
                                resolve();
                            });
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

    private seedNfcToken(nfcToken: NfcToken): NfcToken {
        let wip = this.doorController.seed.toString() + nfcToken.toString();
        //console.log(wip);
        const hash = crypto.Hash('sha256');
        wip = hash.update(wip).digest('hex');
        //console.log(wip);
        return wip;
    }

    /**
     * Deletes the {@link NfcToken} of the {@link User}
     *
     * @param request the request object from the API call.
     * Requires params.identifier
     * @param response the response object for the API call
     */
    public async deleteNfcToken(request: Request, response: Response): Promise<void> {
        return new Promise(async (resolve) => {
            const user: User = new User(request.params.identifier);
            this.databaseFactory
                .createMidwareConnection()
                .then((midwareConnection) => {
                    DatabaseService.getInstance()
                        .getNfcToken(user, midwareConnection)
                        .then((oldNfcToken) => {
                            DatabaseService.getInstance()
                                .setNfcToken(user, response.locals.databaseConnection)
                                .then(() => {
                                    //update door
                                    if (oldNfcToken) {
                                        this.nfcTokens = this.nfcTokens.filter((nfcToken) => {
                                            return (
                                                JSON.stringify(nfcToken) !=
                                                    JSON.stringify(oldNfcToken) && nfcToken
                                            );
                                        });
                                        this.doorController
                                            .deleteNfcToken([oldNfcToken])
                                            .then(() => {
                                                response.status(200).json({});
                                                resolve();
                                            })
                                            .catch(() => {
                                                errorHandling(new DoorConnectError(), response);
                                                resolve();
                                            });
                                    } else {
                                        response.status(200).json({});
                                        resolve();
                                    }
                                })
                                .catch((error) => {
                                    errorHandling(error, response);
                                    resolve();
                                });
                        })
                        .catch((error) => {
                            errorHandling(error, response);
                            return resolve();
                        });
                })
                .catch((error) => {
                    errorHandling(error, response);
                    return resolve();
                });
        });
    }

    /**
     * Gets the {@link NfcToken} of the {@link User}
     *
     * @param request the request object from the API call.
     * Requires params.identifier
     * @param response the response object for the API call
     */
    public async getNfcToken(request: Request, response: Response): Promise<void> {
        return new Promise((resolve) => {
            const user: User = new User(request.params.identifier);
            user.username = request.params.identifier;
            try {
                DatabaseService.getInstance()
                    .getNfcToken(user, response.locals.databaseConnection)
                    .then((value) => {
                        response.status(200).json({
                            username: user.username,
                            nfcToken: value
                        });
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
     * Puts a list of all usernames in the response
     *
     * @param request the request object from the API call
     * @param response the response object for the API call
     */
    public async getAllUsernames(request: Request, response: Response): Promise<void> {
        return new Promise((resolve) => {
            this.loadUsernames(response)
                .then(() => {
                    const value: object[] = [];

                    this.usernames.forEach((username) => {
                        value.push(username);
                    });

                    response.status(200).json({
                        usernames: value
                    });
                    resolve();
                })
                .catch(() => {
                    resolve();
                });
        });
    }

    /**
     * Puts the {@link NfcToken} in an array in the response body
     *
     * @param request the request object from the API call
     * @param response the response object for the API call
     */
    public async getAllNfcTokens(request: Request, response: Response): Promise<void> {
        return new Promise((resolve) => {
            this.loadNfcTokens(response)
                .then(() => {
                    const value: object[] = [];

                    response.status(200);
                    this.nfcTokens.forEach((nfcToken) => {
                        value.push(nfcToken);
                    });
                    response.json({
                        nfcTokens: value
                    });
                    resolve();
                })
                .catch(() => {
                    resolve();
                });
        });
    }

    private async loadUsernames(response: Response): Promise<void> {
        const dbCon = await this.databaseFactory.createMidwareConnection().catch((error) => {
            errorHandling(error, response);
            return Promise.reject();
        });
        return new Promise((resolve, reject) => {
            try {
                DatabaseService.getInstance()
                    .getAllUserNames(dbCon)
                    .then((value) => {
                        this.usernames = value;
                        resolve();
                    })
                    .catch(() => {
                        errorHandling(
                            new InternalServerError(
                                LanguageService.getInstance().translate(
                                    ERROR_MESSAGES.CANNOT_FIND_FIELD_USERNAME
                                )
                            ),
                            response
                        );
                        return reject();
                    });
            } catch (error) {
                errorHandling(error, response);
                return reject();
            }
        });
    }

    /**
     * Loads {@link NfcToken} from the Database to the class and returns it as {@link Promise}
     *
     * @param response optional attribute to make error handling directly in this method
     */
    public async loadNfcTokens(response?: Response): Promise<Array<NfcToken>> {
        if (this.nfcTokens.length == 0) {
            const dbCon = await this.databaseFactory.createMidwareConnection().catch((error) => {
                if (response) {
                    errorHandling(error, response);
                    return Promise.reject();
                }
                return Promise.reject(error);
            });
            return new Promise(async (resolve, reject) => {
                try {
                    DatabaseService.getInstance()
                        .getAllNfcTokens(dbCon)
                        .then((value) => {
                            this.nfcTokens = value;
                            resolve(this.nfcTokens);
                        })
                        .catch((error) => {
                            if (response) {
                                errorHandling(
                                    new InternalServerError(
                                        LanguageService.getInstance().translate(
                                            ERROR_MESSAGES.CANNOT_FIND_FIELD_NFC_TOKEN
                                        )
                                    ),
                                    response
                                );
                                reject();
                            } else {
                                reject(error);
                            }
                        });
                } catch (error) {
                    if (response) errorHandling(error, response);
                    reject();
                }
            });
        } else {
            return Promise.resolve(this.nfcTokens);
        }
    }
}
