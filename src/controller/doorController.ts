import { Request, Response } from 'express';

const crypto = require('crypto');

import { Hash, NfcToken } from 'shared-utilities';

import { DoorSingleton } from '../model/doorSingleton.model';
import { HttpService } from '../services/http.service';
import { DoorConnectError, errorHandling } from '../model/errors';
import { UserController } from './user.controller';
import { HttpsConnection } from 'src/model/httpsConnection';
import { DatabaseService } from '../database/database.service';
import { DoorConfig } from '../model/config.model';
import { DatabaseFactory } from '../database/databaseFactory';

/**
 * Manages open door and holding the nfc tokens on microcontroller up-to-date
 * Refreshes the nfc tokens at the door microcontroller in a given time period
 *
 * @author Lennart Rak
 * @author Gregor Peters
 * @version 1.0
 */
export class DoorController {
    private static readonly MAX_NFC_TOKEN_UPDATE_COUNTER: number = 50;

    private readonly _doorSingleton: DoorSingleton;

    private readonly checkDoorControllerTime: number = 24 * 60 * 60 * 1000;
    private readonly checkDoorControllerAfterFailureTime: number = 500000;
    private connection?: HttpsConnection;

    private readonly doorConfig: DoorConfig;

    private readonly databaseFactory: DatabaseFactory;

    /**
     * Starts the Timer for updating the nfc tokens on creation
     */
    public constructor(doorConfig: DoorConfig, databaseFactory: DatabaseFactory) {
        this.doorConfig = doorConfig;
        this._doorSingleton = DoorSingleton.getInstance(
            doorConfig.endpoint.value,
            doorConfig.psk.value,
            doorConfig.seed
        );
        setTimeout(this.timeoutCallback.bind(this), this.checkDoorControllerTime);
        this.connection = HttpService.getInstance().getConnection(
            this._doorSingleton.microcontroller.endpoint.toString()
        );

        this.databaseFactory = databaseFactory;
    }

    private timeoutCallback(): void {
        this.updateDoorController()
            .then(() => {
                setTimeout(this.timeoutCallback.bind(this), this.checkDoorControllerTime);
            })
            .catch(() => {
                setTimeout(
                    this.timeoutCallback.bind(this),
                    this.checkDoorControllerAfterFailureTime
                );
            });
    }

    /**
     * Sends an open door request to the door microcontroller
     *
     * @param request the request object from the API call
     * @param response the response object for the API call
     */
    public async open(request: Request, response: Response) {
        if (!this.connection) {
            this.connection = HttpService.getInstance().getConnection(
                this._doorSingleton.microcontroller.endpoint.toString()
            );
        }
        HttpService.getInstance()
            .post(
                this._doorSingleton.microcontroller.endpoint.toString() + this.doorConfig.openPath,
                undefined,
                {
                    [this.doorConfig.psk.name.toString()]:
                        this._doorSingleton.microcontroller.psk.toString()
                },
                this.connection
            )
            .then((value) => {
                response.status(value.status).json(value.body);
            })
            .catch(() => {
                return errorHandling(new DoorConnectError(), response);
            });
    }

    /**
     * Updates a {@link NfcToken}
     *
     * @param newToken the new {@link NfcToken}
     * @param oldToken the old {@link NfcToken} the new token should replace.
     * Is not required if a completely new token should be inserted
     */
    public async updateNfcToken(newToken: NfcToken[], oldToken?: NfcToken): Promise<void> {
        if (!this.connection) {
            this.connection = HttpService.getInstance().getConnection(
                this._doorSingleton.microcontroller.endpoint.toString()
            );
        }
        if (!newToken || newToken.length < 1) return new Promise((resolve, reject) => reject());
        let body: {};
        if (oldToken) {
            body = {
                tokens: [
                    {
                        toPut: newToken[0],
                        toReplace: oldToken
                    }
                ]
            };
        } else {
            body = {
                tokens: newToken.map((token) => {
                    return {
                        toPut: token
                    };
                })
            };
        }

        return new Promise((resolve, reject) => {
            HttpService.getInstance()
                .put(
                    this._doorSingleton.microcontroller.endpoint.toString() +
                        this.doorConfig.updateNfcTokenPath,
                    body,
                    {
                        [this.doorConfig.psk.name.toString()]:
                            this._doorSingleton.microcontroller.psk.toString()
                    },
                    this.connection
                )
                .then((value) => {
                    if (value.status == 200) {
                        resolve();
                    } else {
                        reject();
                    }
                })
                .catch(() => {
                    reject();
                });
        });
    }

    /**
     * Deletes many or all {@link NfcToken}
     *
     * @param token the {@link NfcToken} to delete
     * @param deleteAll true if all {@link NfcToken} should be deleted, false otherwise
     */
    public async deleteNfcToken(token: NfcToken[], deleteAll?: boolean): Promise<void> {
        if (!this.connection) {
            this.connection = HttpService.getInstance().getConnection(
                this._doorSingleton.microcontroller.endpoint.toString()
            );
        }
        let body: {};
        if (deleteAll) {
            body = {
                deleteAll: true
            };
        } else {
            body = {
                tokens: token
            };
        }

        return new Promise((resolve, reject) => {
            HttpService.getInstance()
                .delete(
                    this._doorSingleton.microcontroller.endpoint.toString() +
                        this.doorConfig.deleteNfcTokenPath,
                    body,
                    {
                        [this.doorConfig.psk.name.toString()]:
                            this._doorSingleton.microcontroller.psk.toString()
                    },
                    this.connection
                )
                .then((value) => {
                    if (value.status == 200) {
                        resolve();
                    } else {
                        reject();
                    }
                })
                .catch(() => {
                    reject();
                });
        });
    }

    /**
     * Get seed from the microcontroller
     */
    public get seed(): Hash {
        return this._doorSingleton.microcontroller.psk;
    }

    private async getDoorControllerHash(): Promise<Hash> {
        if (!this.connection) {
            this.connection = HttpService.getInstance().getConnection(
                this._doorSingleton.microcontroller.endpoint.toString()
            );
        }
        return new Promise((resolve, reject) => {
            console.log(
                this._doorSingleton.microcontroller.endpoint.toString() +
                    this.doorConfig.getValidationPath
            );
            console.log({
                [this.doorConfig.psk.name.toString()]:
                    this._doorSingleton.microcontroller.psk.toString()
            });
            HttpService.getInstance()
                .get(
                    this._doorSingleton.microcontroller.endpoint.toString() +
                        this.doorConfig.getValidationPath,
                    {
                        [this.doorConfig.psk.name.toString()]:
                            this._doorSingleton.microcontroller.psk.toString()
                    },
                    this.connection
                )
                .then((value) => {
                    if (value.status == 200) {
                        resolve(new Hash(value.body.hash));
                    } else {
                        console.log(value);
                        reject();
                    }
                })
                .catch((error) => {
                    console.log(error);
                    reject();
                });
        });
    }

    /**
     * Checks if the microcontroller is up-to-date and refreshes it on purpose
     *
     * @param request the request object from the API call
     * @param response the response object for the API call
     */
    public async updateDoorControllerViaRequest(
        request: Request,
        response: Response
    ): Promise<void> {
        this.updateDoorController()
            .then(() => {
                response.status(200).json({});
            })
            .catch(() => {
                response.status(560).json({});
            });
    }

    private async updateDoorController(): Promise<void> {
        return new Promise((resolve, reject) => {
            new UserController(this, 0, this.databaseFactory)
                .loadNfcTokens()
                .then(async (nfcTokens) => {
                    console.log(nfcTokens);
                    const hash = this.generateHash(nfcTokens);
                    console.log(hash);

                    this.getDoorControllerHash()
                        .then((doorHash) => {
                            console.log(doorHash);

                            if (JSON.stringify(hash) != JSON.stringify(doorHash)) {
                                //Need to reset values on door
                                this.deleteNfcToken([], true)
                                    .then(async () => {
                                        //Insert every nfc token
                                        let i = 0;
                                        while (i < nfcTokens.length) {
                                            let j = i;
                                            const nfcTokensToUpdate: NfcToken[] = [];
                                            while (
                                                i <
                                                    j +
                                                        DoorController.MAX_NFC_TOKEN_UPDATE_COUNTER -
                                                        1 &&
                                                i < nfcTokens.length
                                            ) {
                                                nfcTokensToUpdate.push(nfcTokens[i]);
                                                i++;
                                            }
                                            //update here
                                            await this.updateNfcToken(nfcTokensToUpdate).catch(
                                                () => {
                                                    reject();
                                                }
                                            );
                                        }

                                        console.log('Successfully updated Microcontroller');
                                        resolve();
                                    })
                                    .catch(() => {
                                        console.log('Deletion failed');
                                        reject();
                                    });
                            } else {
                                //Everything is ok
                                resolve();
                            }
                        })
                        .catch(() => {
                            console.log('Cannot get Hash form Door');
                            reject();
                        });
                })
                .catch((error) => {
                    console.log(error.message);
                    reject();
                });
        });
    }

    private generateHash(nfcTokens: NfcToken[]): Hash {
        const token: string[] = [];
        nfcTokens.forEach((nfcToken) => {
            token.push(nfcToken.toString());
        });
        token.sort();

        let tokenString: string = '';
        token.forEach((singleToken) => {
            tokenString += singleToken;
        });

        const hash = crypto.Hash('sha256');
        return hash.update(tokenString).digest('hex');
    }

    /**
     * Get the configuration door singleton
     */
    public get doorSingleton(): DoorSingleton {
        return this._doorSingleton;
    }
}
