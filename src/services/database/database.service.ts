import { DatabaseConfig } from '../../model/databaseConfig';
import { LanguageService } from '../language.service';
import { DatabaseLocation } from '../../model/database/databaseLocation';
import {
    Username,
    EventSubscriber,
    NfcToken,
    Event,
    Name,
    Endpoint,
    Url,
    Identifier,
    SubscriberLabel
} from 'shared-utilities';

import { User } from '../../model/user.model';
import { DoorSingleton } from '../../model/doorSingleton.model';
import { DatabaseConnection } from '../../controller/database/databaseConnection';
import { DatabaseEntry } from '../../model/database/databaseEntry';
import { DatabaseEntryProperty } from '../../model/database/databaseEntryProperty';
import { InternalServerError } from '../../model/errors';
import { ERROR_MESSAGES } from '../../res/error.messages';
import { DatabaseFactory } from '../../controller/database/databaseFactory';

/**
 * DatabaseService delegates queries to the {@link DatabaseConnection}
 */
export class DatabaseService {
    private _config: DatabaseConfig;
    private databaseFactory: DatabaseFactory;
    private static instance: DatabaseService;

    private constructor(config: DatabaseConfig, databaseFactory: DatabaseFactory) {
        this._config = config;
        this.databaseFactory = databaseFactory;
    }

    /**
     * Provides the current instance of {@link DatabaseService}.
     * @param config {@link DatabaseConfig} must be passed in the initial call
     * @param databaseFactory databaseFactory to use
     * @returns Instance of {@link DatabaseService}.
     */
    public static getInstance(
        config?: DatabaseConfig,
        databaseFactory?: DatabaseFactory
    ): DatabaseService {
        if (!DatabaseService.instance) {
            if (!config || !databaseFactory) {
                throw new Error(
                    LanguageService.getInstance().translate(
                        ERROR_MESSAGES.DATABASE_CONFIG_MANDATORY
                    )
                );
            }
            DatabaseService.instance = new DatabaseService(config, databaseFactory);
        }
        return DatabaseService.instance;
    }


    /**
     * Requests all {@link Username}s.
     * @param databaseConnection {@link DatabaseConnection} to be used.
     * @returns Promise of {@link Username}[]
     */
    public async getAllUserNames(databaseConnection: DatabaseConnection): Promise<Username[]> {
        const username: DatabaseEntryProperty<Username> = {
            ...this._config.user.name
        } as DatabaseEntryProperty<Username>;
        const userLocation: DatabaseLocation = {
            ...this._config.user.location
        } as DatabaseLocation;

        const T = { [this._config.user.name.name]: Username };

        return new Promise<Username[]>((resolve, reject) => {
            databaseConnection
                .getMany<typeof T>(userLocation, [username])
                .then((databaseEntries) => {
                    let output: Username[] = [];
                    databaseEntries.forEach((databaseEntry) => {
                        if (!databaseEntry.object) {
                            return reject(new InternalServerError());
                        }

                        output.push(
                            new Username(databaseEntry.object[this._config.user.name.name])
                        );
                    });
                    return resolve(output);
                })
                .catch((error) => {
                    return reject(error);
                });
        });
    }

    /**
     * Requests all {@link NfcToken}s.
     * @param databaseConnection {@link DatabaseConnection} to be used.
     * @returns Promise of {@link NfcToken}[]
     */
    public async getAllNfcTokens(databaseConnection: DatabaseConnection): Promise<NfcToken[]> {
        let nfcToken: DatabaseEntryProperty<NfcToken> = {
            ...this._config.user.nfcToken
        } as DatabaseEntryProperty<NfcToken>;
        let userLocation: DatabaseLocation = { ...this._config.user.location } as DatabaseLocation;

        const T = { [this._config.user.nfcToken.name]: Username };

        return new Promise((resolve, reject) => {
            databaseConnection
                .getMany<typeof T>(userLocation, [nfcToken])
                .then((databaseEntries) => {
                    let output: NfcToken[] = [];
                    databaseEntries.forEach((databaseEntry) => {
                        if (!databaseEntry.object) {
                            return reject(new InternalServerError());
                        }
                        if (databaseEntry.object[this._config.user.nfcToken.name] != undefined) {
                            const nfcToken = new NfcToken(
                                databaseEntry.object[this._config.user.nfcToken.name]
                            );
                            output.push(nfcToken);
                        }
                    });
                    return resolve(output);
                })
                .catch((error) => {
                    return reject(error);
                });
        });
    }

    /**
     * Requests the {@link NfcToken} of an {@link User}.
     * @param user {@link User}, which {@link NfcToken} was requested.
     * @param databaseConnection {@link DatabaseConnection} to be used.
     * @returns Promise. If {@link User} has a {@link NfcToken}, the promise will resolve to the {@link NfcToken}. Else it resolves to undefined.
     */
    public async getNfcToken(
        user: User,
        databaseConnection: DatabaseConnection
    ): Promise<NfcToken | undefined> {
        let nfcToken: DatabaseEntryProperty<NfcToken> = {
            ...this._config.user.nfcToken
        } as DatabaseEntryProperty<NfcToken>;
        let userDatabaseLocation: DatabaseLocation = {
            ...this._config.user.location
        } as DatabaseLocation;
        let identifier: DatabaseEntryProperty<Identifier> = {
            ...this._config.user.identifier
        } as DatabaseEntryProperty<Identifier>;
        identifier.value = user.identifier;

        let filter = this.databaseFactory.createFilter(identifier);
        const T = { [this._config.user.nfcToken.name]: NfcToken };

        return new Promise((resolve, reject) => {
            databaseConnection
                .get<typeof T>(userDatabaseLocation, [nfcToken], filter)
                .then((value) => {
                    if (!value.object) {
                        reject(new InternalServerError());
                    } else {
                        if (value.object[this._config.user.nfcToken.name] != undefined) {
                            resolve(new NfcToken(value.object[this._config.user.nfcToken.name]));
                        } else {
                            resolve(undefined);
                        }
                    }
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    /**
     * Sets the {@link NfcToken} of a {@link User}.
     * @param user {@link User}, whose {@link NfcToken} is to be set.
     * @param databaseConnection {@link DatabaseConnection} to be used.
     * @returns Promise with eventually occurring errors.
     */
    public async setNfcToken(user: User, databaseConnection: DatabaseConnection): Promise<void> {
        let nfcToken: DatabaseEntryProperty<NfcToken> = {
            ...this._config.user.nfcToken
        } as DatabaseEntryProperty<NfcToken>;
        nfcToken.value = user.nfcToken;
        let userDatabaseLocation: DatabaseLocation = {
            ...this._config.user.location
        } as DatabaseLocation;
        let identifier: DatabaseEntryProperty<Identifier> = {
            ...this._config.user.identifier
        } as DatabaseEntryProperty<Identifier>;
        identifier.value = user.identifier;
        let filter = this.databaseFactory.createFilter(identifier);
        return databaseConnection.setProperty(nfcToken, userDatabaseLocation, filter);
    }

    /**
     * Requests all {@link EventSubscriber}.
     * @param databaseConnection {@link DatabaseConnection} to be used.
     * @returns Promise of {@link EventSubscriber}[].
     */
    public async getAllEventSubscriber(
        databaseConnection: DatabaseConnection
    ): Promise<EventSubscriber[]> {
        let eventSubscriberLocation: DatabaseLocation = {
            ...this._config.eventSubscriber.location
        } as DatabaseLocation;
        let eventSubscriberProperties: DatabaseEntryProperty<any>[] = [
            { ...this._config.eventSubscriber.event } as DatabaseEntryProperty<Event>,
            { ...this._config.eventSubscriber.label } as DatabaseEntryProperty<SubscriberLabel>,
            { ...this._config.eventSubscriber.endpoint } as DatabaseEntryProperty<Endpoint>
        ];
        const T = {
            [this._config.eventSubscriber.endpoint.name]: Endpoint,
            [this._config.eventSubscriber.event.name]: Event,
            [this._config.eventSubscriber.label.name]: SubscriberLabel
        };
        return new Promise<EventSubscriber[]>((resolve, reject) => {
            databaseConnection
                .getMany<typeof T>(eventSubscriberLocation, eventSubscriberProperties)
                .then((databaseEntries) => {
                    let output: EventSubscriber[] = [];
                    databaseEntries.forEach((entry) => {
                        if (!entry.object) {
                            return reject(new InternalServerError());
                        }
                        const endpoint: Endpoint = new Endpoint(
                            entry.object[this._config.eventSubscriber.endpoint.name]
                        );
                        const label: SubscriberLabel = new SubscriberLabel(
                            entry.object[this._config.eventSubscriber.label.name]
                        );
                        let event: Event;
                        const str: string = new Name(
                            entry.object[this._config.eventSubscriber.event.name]
                        ).toString();
                        // Ist das die gewünschte Fehlerbehandlung, dass das Event auf BELL_RUNG gesetzt wird, falls der Input nicht matched?
                        // Müsste die Fehlerbehandlung nicht in der Connection stattfinden?
                        let typedEventString: keyof typeof Event = 'BELL_RUNG';
                        Object.keys(Event).forEach((key) => {
                            if (key == str) {
                                typedEventString = str as keyof typeof Event;
                            }
                        });

                        event = Event[typedEventString];

                        output.push(new EventSubscriber(endpoint, event, label));
                    });
                    return resolve(output);
                })
                .catch((error) => {
                    return reject(error);
                });
        });
    }

    /**
     * Adds an {@link EventSubscriber}.
     * @param eventSubscriber {@link EventSubscriber} to be added.
     * @param databaseConnection {@link DatabaseConnection} to be used.
     * @returns Promise with eventually occurring errors.
     */
    public async addEventSubscriber(
        eventSubscriber: EventSubscriber,
        databaseConnection: DatabaseConnection
    ): Promise<void> {
        const identifier = {
            ...this._config.eventSubscriber.identifier
        } as DatabaseEntryProperty<string>;
        identifier.value = eventSubscriber.endpoint.toString();
        let type: DatabaseEntryProperty<string> | undefined;
        if (this._config.eventSubscriber.type) {
            type = { ...this._config.eventSubscriber.type } as DatabaseEntryProperty<string>;
        }

        const object = {
            [this._config.eventSubscriber.event.name]: eventSubscriber.event,
            [this._config.eventSubscriber.label.name]: eventSubscriber.label,
            [this._config.eventSubscriber.endpoint.name]: eventSubscriber.endpoint
        };

        return new Promise((resolve, reject) => {
            databaseConnection
                .create(
                    new DatabaseEntry<any>(
                        { ...this._config.eventSubscriber.location } as DatabaseLocation,
                        object,
                        identifier,
                        type
                    )
                )
                .then(() => {
                    resolve();
                })
                .catch((error) => {
                    return reject(error);
                });
        });
    }

    /**
     * Deletes an {@link EventSubscriber}.
     * @param eventSubscriber {@link EventSubscriber} to be deleted.
     * @param databaseConnection {@link DatabaseConnection} to be used.
     * @returns Promise with eventually occurring errors.
     */
    public async deleteEventSubscriber(
        eventSubscriber: EventSubscriber,
        databaseConnection: DatabaseConnection
    ): Promise<void> {
        let eventSubscriberDatabaseLocation: DatabaseLocation = {
            ...this._config.eventSubscriber.location
        } as DatabaseLocation;
        let identifier: DatabaseEntryProperty<string> = {
            ...this._config.eventSubscriber.identifier
        } as DatabaseEntryProperty<string>;
        identifier.value = eventSubscriber.endpoint.toString();
        let filter = this.databaseFactory.createFilter(identifier);

        return databaseConnection.delete(eventSubscriberDatabaseLocation, filter);
    }
}
