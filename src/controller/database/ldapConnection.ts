import {DatabaseConfig} from '../../model/databaseConfig';
import {LanguageService} from '../../services/language.service';
import {
    AlreadyExistsError,
    EntryNotFound,
    InternalServerError,
    InvalidCredentialsError,
    ReachDatabaseError,
    ResponseError,
    UnknownError
} from '../../model/errors';
import {Url} from 'shared-utilities';
import {DatabaseConnection, DatabaseEntryObject} from './databaseConnection';
import {DatabaseLocation} from '../../model/database/databaseLocation';
import {DatabaseCredentials} from '../../model/database/databaseCredentials';
import {DatabaseEntry} from '../../model/database/databaseEntry';
import {DatabaseEntryProperty} from '../../model/database/databaseEntryProperty';
import {LdapDN} from '../../model/database/ldapDN';
import {LdapFilter} from '../../model/database/ldapFilter';

import LDAP, {Change, Client, Error, SearchCallbackResponse, SearchOptions} from 'ldapjs';

import {ERROR_MESSAGES} from '../../res/error.messages';

const ldapEscape = require('ldap-escape');

/**
 * {@link DatabaseConnection} object for LDAP
 *
 * @author Lennart Rak
 * @author Gregor Peters
 * @version 1.0
 */
export class LdapConnection extends DatabaseConnection {
    public ready: Promise<LdapConnection>;
    private client: Client;

    /**
     * Creates a new {@link LdapConnection} this happens asynchronous. Constructors are not allowed to be asynchronous,
     * so you have to await the public {@link LdapConnection.ready} attribute before using this class.
     *
     * @param credentials to sign in
     * @param url of the database
     * @param config the databaseConfig
     */
    constructor(credentials: DatabaseCredentials, url: Url, config: DatabaseConfig) {
        super(credentials, url);
        this.client = LDAP.createClient({
            url: url.toString()
        });

        this.ready = new Promise((resolve, reject) => {
            this.client.on('error', (error) => {
                reject(new ReachDatabaseError());
            });

            this.client.on('connect', () => {
                this.client.bind(
                    LdapConnection.buildLoginName(credentials.name.toString(), config),
                    credentials.password.toString(),
                    (error: Error | null) => {
                        if (error) {
                            reject(new InvalidCredentialsError());
                        } else {
                            resolve(this);
                        }
                    }
                );
            });
        });
    }

    /**
     * Parses username into ldapDn
     * @param name Username
     * @param config DatabaseConfig
     * @returns LDAP Dn of user
     */
    private static buildLoginName(name: string, config: DatabaseConfig): string {
        if (config.midware.credentials.name != name) {
            return `${config.user.identifier.name}=` + ldapEscape.dn`${name}` + `,${config.user.location.name}`;
        } else {
            return name;
        }
    }


    /**
     * Returns multiple {@link DatabaseEntryObject} of type T.
     *
     * changed T to any in property param
     *
     * @param location where the method looks for the entry
     * @param properties you wish to get
     * @param filter for the search in the database
     */
    public async getMany<T extends DatabaseEntryObject>(
        location: DatabaseLocation,
        properties: DatabaseEntryProperty<any>[],
        filter?: LdapFilter
    ): Promise<Array<DatabaseEntry<T>>> {
        let opts: SearchOptions = {
            scope: 'one',
            filter: '(&(objectClass=*)(!(ou=*)))'
        };
        if (filter) {
            opts.filter = filter.get();
        }
        if (properties) {
            let propertyNames: string[] = [];
            properties.forEach((property) => {
                propertyNames.push(property.name);
            });
            opts.attributes = propertyNames;
        }

        //console.log(JSON.stringify(opts));

        return new Promise((resolve, reject) =>
            this.client.search(
                location.name,
                opts,
                function (error: Error | null, response: SearchCallbackResponse) {
                    if (error) {
                        reject(LdapConnection.ldapErrorHandling(error));
                    } else {
                        let output: DatabaseEntry<T>[] = [];
                        response.on('searchEntry', function (entry) {
                            let outputElement: DatabaseEntryObject = {};
                            properties.forEach((property) => {
                                outputElement[property.name] = entry.object[property.name];
                            });

                            output.push(
                                new DatabaseEntry(
                                    new LdapDN(entry.object.dn.toString()),
                                    outputElement as T
                                )
                            );
                        });

                        response.on('error', (error) => {
                            reject(LdapConnection.ldapErrorHandling(error));
                        });

                        response.on('end', (result) => {
                            resolve(output);
                        });
                    }
                }
            )
        );
    }

    /**
     * Returns one {@link DatabaseEntryObject} of type T.
     *
     * @param location where the method looks for the entry
     * @param properties you wish to get
     * @param filter for the search in the database
     */
    public async get<T extends DatabaseEntryObject>(
        location: DatabaseLocation,
        properties: DatabaseEntryProperty<any>[],
        filter?: LdapFilter
    ): Promise<DatabaseEntry<T>> {
        let opts: SearchOptions = {
            scope: 'sub',
            filter: '(objectClass=*)'
        };
        if (filter) {
            opts.filter = filter.get();
        }
        if (properties) {
            let propertyNames: string[] = [];
            properties.forEach((property) => {
                propertyNames.push(property.name);
            });
            opts.attributes = propertyNames;
        }

        return new Promise((resolve, reject) =>
            this.client.search(
                location.name,
                opts,
                function (error: LDAP.Error | null, response: SearchCallbackResponse) {
                    if (error) {
                        reject(LdapConnection.ldapErrorHandling(error));
                    } else {
                        let output: DatabaseEntryObject = {};
                        response.on('searchEntry', function (entry) {
                            properties.forEach((property) => {
                                output[property.name] = entry.object[property.name];
                            });

                            resolve(
                                new DatabaseEntry(
                                    new LdapDN(entry.object.dn.toString()),
                                    output as T
                                )
                            );
                        });
                        response.on('error', function (error: LDAP.Error) {
                            reject(LdapConnection.ldapErrorHandling(error));
                        });

                        response.on('end', () => {
                            if (JSON.stringify(output) == JSON.stringify({})) {
                                reject(new EntryNotFound());
                            } else {
                                reject(
                                    new InternalServerError(
                                        'The Program should never enter this point'
                                    )
                                );
                            }
                        });
                    }
                }
            )
        );
    }

    /**
     * Overwrites the property of all objects at the location, matching the filter.
     *
     *
     * @param property property to be overwritten
     * @param location location of the object(s)
     * @param filter filters all objects at location.
     */
    public async setProperty(
        property: DatabaseEntryProperty<any>,
        location: DatabaseLocation,
        filter?: LdapFilter
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            if (filter) {
                this.getDNs(location, filter)
                    .then(async (dns) => {
                        const setProperties: Promise<void | LDAP.Error>[] = [];
                        dns.forEach((dn) => {
                            setProperties.push(
                                this.setPropertyWithOutFilter(property, new LdapDN(dn))
                            );
                        });
                        await Promise.all(setProperties).catch((error) => {
                            console.log(
                                LanguageService.getInstance().translate(
                                    ERROR_MESSAGES.DATABASE_SET
                                )
                            );
                            console.log(error.message);
                            reject(error);
                        });
                        resolve();
                    })
                    .catch((error) => {
                        console.log(
                            LanguageService.getInstance().translate(ERROR_MESSAGES.LDAP_DN)
                        );
                        console.log(error.message);
                        reject(error);
                    });
            } else {
                this.setPropertyWithOutFilter(property, location)
                    .then(() => {
                        resolve();
                    })
                    .catch((error) => {
                        console.log(
                            LanguageService.getInstance().translate(ERROR_MESSAGES.DATABASE_SET)
                        );
                        console.log(error.message);
                        reject(error);
                    });
            }
        });
    }

    /**
     * Hier habe ich was kaputt gemacht :) (vielleicht)
     * @param property
     * @param location
     * @private
     */
    private async setPropertyWithOutFilter(
        property: DatabaseEntryProperty<any>,
        location: DatabaseLocation
    ): Promise<void | Error> {
        const change = {
            operation: 'replace',
            modification: {
                [property.name]: property.value
            }
        } as Change;

        return new Promise((resolve, reject) => {
            this.client.modify(location.name, change, (error: LDAP.Error) => {
                if (error) {
                    reject(LdapConnection.ldapErrorHandling(error));
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Deletes the entry at the location, matching the filter
     *
     * @param location location of the object(s)
     * @param filter to apply on the query
     */
    public async delete(location: DatabaseLocation, filter?: LdapFilter): Promise<void> {
        return new Promise((resolve, reject) => {
            if (filter) {
                this.getDNs(location, filter)
                    .then(async (dns) => {
                        const deletes: Promise<void | LDAP.Error>[] = [];
                        dns.forEach((dn) => {
                            deletes.push(this.deleteWithoutFilter(new LdapDN(dn)));
                        });
                        await Promise.all(deletes).catch((error) => {
                            console.log(
                                LanguageService.getInstance().translate(
                                    ERROR_MESSAGES.DATABASE_DELETE
                                )
                            );
                            console.log(error.message);
                            reject(error);
                        });
                        resolve();
                    })
                    .catch((error) => {
                        console.log(
                            LanguageService.getInstance().translate(ERROR_MESSAGES.LDAP_DN)
                        );
                        console.log(error.message);
                        reject(error);
                    });
            } else {
                this.deleteWithoutFilter(location)
                    .then(() => {
                        resolve();
                    })
                    .catch((error) => {
                        console.log(
                            LanguageService.getInstance().translate(ERROR_MESSAGES.DATABASE_DELETE)
                        );
                        console.log(error.message);
                        reject(error);
                    });
            }
        });
    }

    private async deleteWithoutFilter(location: DatabaseLocation): Promise<void> {
        return new Promise((resolve, reject) =>
            this.client.del(location.name, (error) => {
                if (error) {
                    reject(LdapConnection.ldapErrorHandling(error));
                } else {
                    resolve();
                }
            })
        );
    }

    /**
     * Add the entry to the database at the location given through the entry.
     *
     * @param entry
     */
    public async create(entry: DatabaseEntry<any>): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!entry.identifier || !entry.type) {
                return reject(
                    new Error(
                        LanguageService.getInstance().translate(
                            ERROR_MESSAGES.IDENTIFIER_TYPE_MANDATORY
                        )
                    )
                );
            }

            entry.location.name =
                entry.identifier.name + '=' + entry.identifier.value + ',' + entry.location.name;
            entry.object[entry.type.name] = entry.type.value;

            this.client.add(entry.location.name, entry.object, (error: LDAP.Error) => {
                if (error) {
                    reject(LdapConnection.ldapErrorHandling(error));
                } else {
                    resolve();
                }
            });
        });
    }

    private async getDNs(location: DatabaseLocation, filter: LdapFilter): Promise<string[]> {
        let opts: SearchOptions = {
            scope: 'sub',
            attributes: ['objectClass'],
            filter: filter.get()
        };
        return new Promise((resolve, reject) => {
            this.client.search(
                location.name,
                opts,
                function (error: LDAP.Error | null, response: SearchCallbackResponse) {
                    if (error) {
                        reject(LdapConnection.ldapErrorHandling(error));
                    } else {
                        let output: string[] = [];
                        response.on('searchEntry', function (entry) {
                            output.push(entry.dn);
                        });
                        response.on('error', (error) => {
                            reject(LdapConnection.ldapErrorHandling(error));
                        });
                        response.on('end', (result) => {
                            if (output.length > 0) {
                                resolve(output);
                            } else {
                                reject(new EntryNotFound());
                            }
                        });
                    }
                }
            );
        });
    }

    private static ldapErrorHandling(error: LDAP.Error): ResponseError {
        switch (error.code) {
            case 32:
                return new EntryNotFound();
            case 68:
                return new AlreadyExistsError();

            default:
                console.log(
                    LanguageService.getInstance().translate(ERROR_MESSAGES.LDAP_UNKNOWN) +
                    error.code
                );
                return new UnknownError();
        }
    }
}
