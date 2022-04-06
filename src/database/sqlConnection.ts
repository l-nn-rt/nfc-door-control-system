import { LanguageService } from '../services/language.service';
import { Url } from 'shared-utilities';
import { ColumnValue, Connection, ConnectionConfig, Request } from 'tedious';
import { DatabaseConfig } from '../model/databaseConfig';
import {
    AuthenticationError,
    InvalidCredentialsError,
    InternalServerError,
    EntryNotFound,
    ReachDatabaseError
} from '../model/errors';
import { DatabaseConnection, DatabaseEntryObject } from './databaseConnection';
import { DatabaseCredentials } from './databaseCredentials';
import { DatabaseEntry } from './databaseEntry';
import { DatabaseEntryProperty } from './databaseEntryProperty';
import { DatabaseFilter } from './databaseFilter';
import { DatabaseLocation } from './databaseLocation';
import { SqlFactory } from './sqlFactory';
import { ERROR_MESSAGES } from '../res/error.messages';

/**
 * Es klappt wahrscheinlich nicht mit zu vielen Anfragen...
 * Alle paar Anfragen sollte die Connection ausgetauscht werden...
 */
export class SqlConnection extends DatabaseConnection {
    connection: Connection;
    readonly connectionConfig: ConnectionConfig;
    readonly config: DatabaseConfig;
    readonly timeout = 100000;
    private groups: string[] = [];

    /**
     * Creates a new {@link SqlConnection}
     *
     * @param credentials Credentials of the user
     * @param url url to SQL-Server
     * @param c databaseConfig
     */
    constructor(credentials: DatabaseCredentials, url: Url, c: DatabaseConfig) {
        super(credentials, url);
        let portStartIndex = url.indexOf(':');
        let portEndIndex = url.indexOf('/', portStartIndex);
        if (portEndIndex == -1) {
            portEndIndex = url.length;
        }
        let server = url.slice(0, portStartIndex) + url.slice(portEndIndex + 1);
        let port = parseInt(url.slice(portStartIndex + 1, portEndIndex + 1));
        this.config = c;
        this.connectionConfig = {
            server: server,
            authentication: {
                type: 'default',
                options: {
                    userName: c.midware.credentials.name.toString(),
                    password: c.midware.credentials.password.toString()
                }
            },
            options: {
                encrypt: false,
                port: port,
                connectTimeout: this.timeout
            }
        };
        this.connection = new Connection(this.connectionConfig);
        this.connection.on('connect', function (err) {
            console.log('Connected to SQL-Database');
        });
    }

    /**
     * Validates credentials and init some variables.
     * @returns Promise. Rejects if credentials are invalid or something else went wrong.
     */
    public async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.connection.connect((error) => {
                if (error) {
                    return reject(new ReachDatabaseError(error.message?error.message:undefined));
                } else {
                    if (this.config.auth) {
                        this.getUserGroups()
                            .then((groups) => {
                                this.groups = groups;
                            })
                            .catch((error) => {
                                return reject(error);
                            });
                        this.getPassword()
                            .then((password) => {
                                if (password != this.credentials.password) {
                                    return reject(new InvalidCredentialsError());
                                }
                                return resolve();
                            })
                            .catch((error) => {
                                return reject(error);
                            });
                    } else {
                        return resolve();
                    }
                }
            });
        });
    }
    private async getPassword(): Promise<string> {
        return new Promise((resolve, reject) => {
            if (this.config.auth) {
                this.get<{ [p: string]: string }>(
                    this.config.user.location,
                    [this.config.auth.password],
                    SqlFactory.createFilter(
                        new DatabaseEntryProperty<string>(
                            this.config.user.identifier.name,
                            this.credentials.name.toString()
                        )
                    )
                )
                    .then((entry) => {
                        if (!entry.object) {
                            return reject(new InternalServerError());
                        }
                        if (!this.config.auth) {
                            return reject(new InternalServerError());
                        }
                        return resolve(entry.object[this.config.auth.password.name]);
                    })
                    .catch((e) => reject(e));
            } else {
                reject(new InternalServerError());
            }
        });
    }
    /**
     * Creates a new entry in database.
     * @param entry Entry to be created
     * @returns Promise with eventually occurring errors.
     */
    public async create(entry: DatabaseEntry<any>): Promise<void> {
        let values: string = '';
        let keys: string = '';
        if (!entry.object) return Promise.reject(new InternalServerError());
        if (this.config.auth) {
            entry.object[this.config.auth.permission.name] = new SQLAuth(
                new SQLAuthObj(
                    [this.credentials.name.toString()],
                    this.config.auth.groups.default.read
                ),
                new SQLAuthObj(
                    [this.credentials.name.toString()],
                    this.config.auth.groups.default.write
                )
            );
        }
        for (let prop in entry.object) {
            values += `${
                entry.object[prop] ? "'" + JSON.stringify(entry.object[prop]) + "'" : 'null'
            }, `;
            keys += `[${prop}], `;
        }
        values = values.slice(0, -2);
        keys = keys.slice(0, -2);
        return new Promise((resolve, reject) => {
            const request = new Request(
                `INSERT INTO ${SqlConnection.formatLocation(
                    entry.location
                )} (${keys}) VALUES (${values});`,
                (error, rowCount, rows) => {
                    if (error) {
                        return reject(error);
                    } else {
                        return resolve();
                    }
                }
            );
            this.performSQLRequest(request, reject);
        });
    }

    /**
     * Gets a single object from database.
     * @param location Sql-Table
     * @param properties Properties to be preserved
     * @param filter Query filter.
     * @returns Result of type {@link DatabaseEntry} or error.
     */
    public get<T extends DatabaseEntryObject>(
        location: DatabaseLocation,
        properties: DatabaseEntryProperty<any>[],
        filter?: DatabaseFilter
    ): Promise<DatabaseEntry<T>> {
        return new Promise((resolve, reject) => {
            this.getMany<T>(location, properties, filter)
                .then((entries) => {
                    if (entries.length == 0) reject(new EntryNotFound());
                    resolve(entries[0]);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    /**
     * Gets a many objects from database.
     * @param location Sql-Table.
     * @param properties Properties to be preserved.
     * @param filter Query filter.
     * @returns Result of type {@link DatabaseEntry}[] or error.
     */
    public async getMany<T extends DatabaseEntryObject>(
        location: DatabaseLocation,
        properties: DatabaseEntryProperty<any>[],
        filter?: DatabaseFilter
    ): Promise<DatabaseEntry<T>[]> {
        if (properties.length == 0)
            return Promise.reject(
                new InternalServerError(
                    LanguageService.getInstance().translate(ERROR_MESSAGES.PROPERTY_MANDATORY)
                )
            );
        let prop: string = '';
        properties.forEach((property) => {
            prop += `[${property.name.split('.').join('].[')}], `;
        });
        prop = prop.slice(0, -2);
        let checkAuth =
            this.config.auth &&
            !prop.includes(this.config.auth.permission.name) &&
            !prop.includes(this.config.auth.groups.member.name);
        if (checkAuth) {
            await this.checkAuth(SQLAuthType.READ, location, filter).catch((e) => {
                return Promise.reject(e);
            });
        }
        return new Promise((resolve, reject) => {
            const request: Request = new Request(
                `SELECT ${prop} FROM ${SqlConnection.formatLocation(location)}${
                    filter ? ' ' + filter.get() : ''
                }`,
                (error, rowCount, rows) => {
                    if (error) {
                        return reject(error);
                    }
                    return resolve(output);
                }
            );
            let output: DatabaseEntry<T>[] = [];
            request.on('row', (columns: ColumnValue[]) => {
                let entry: DatabaseEntryObject = {};
                columns.forEach((column) => {
                    entry[column.metadata.colName] = JSON.parse(column.value);
                });
                output.push(new DatabaseEntry<T>(location, entry as T));
            });
            this.performSQLRequest(request, reject);
        });
    }

    /**
     * Sets a property of all matching entries.
     * @param property Property to be set
     * @param location SQL-Table
     * @param filter Query-Filter
     * @returns Promise with eventually occurring errors.
     */
    public async setProperty(
        property: DatabaseEntryProperty<any>,
        location: DatabaseLocation,
        filter?: DatabaseFilter
    ): Promise<void> {
        if (this.config.auth) {
            await this.checkAuth(SQLAuthType.WRITE, location, filter).catch((e) => {
                return Promise.reject(e);
            });
        }
        return new Promise((resolve, reject) => {
            const request: Request = new Request(
                `UPDATE ${SqlConnection.formatLocation(location)} SET [${property.name}] = ${
                    property.value ? "'" + JSON.stringify(property.value) + "'" : 'null'
                }${filter ? ' ' + filter.get() : ''}`,
                (error, rowCount, rows) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                }
            );
            this.performSQLRequest(request, reject);
        });
    }

    /**
     * Deletes all matching entries.
     * @param location SQL-Table.
     * @param filter Query-Filter.
     * @returns Promise with eventually occurring errors.
     */
    public async delete(location: DatabaseLocation, filter: DatabaseFilter): Promise<void> {
        if (this.config.auth) {
            await this.checkAuth(SQLAuthType.WRITE, location, filter).catch((err) => {
                return Promise.reject(err);
            });
        }
        return new Promise((resolve, reject) => {
            const request: Request = new Request(
                `DELETE FROM ${SqlConnection.formatLocation(location)} ${filter?.get()}`,
                (error, rowCount, rows) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                }
            );
            this.performSQLRequest(request, reject);
        });
    }

    private async getUserGroups(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            if (this.config.auth) {
                let ident: DatabaseEntryProperty<string> = {
                    ...this.config.user.identifier
                } as DatabaseEntryProperty<string>;
                ident.value = this.credentials.name.toString();
                this.get<DatabaseEntryObject>(
                    this.config.user.location,
                    [this.config.auth.groups.member],
                    SqlFactory.createFilter(ident)
                )
                    .then((value) => {
                        if (value.object) {
                            if (this.config.auth)
                                resolve(value.object[this.config.auth?.groups.member.name]);
                        } else {
                            reject();
                        }
                    })
                    .catch((error) => {
                        reject(error);
                    });
            }
        });
    }

    private checkAuth(
        type: SQLAuthType,
        location: DatabaseLocation,
        filter?: DatabaseFilter
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            this.getAuth(location, filter)
                .then((auths) => {
                    auths.forEach((auth) => {
                        let authObj: SQLAuthObj | undefined =
                            type == SQLAuthType.READ ? auth.read : auth.write;
                        if (!authObj) return resolve();
                        let authenticated = false;
                        if (authObj.user?.includes(this.credentials.name.toString())) {
                            authenticated = true;
                        }
                        authObj.groups?.forEach((group) => {
                            if (this.groups.includes(group)) {
                                authenticated = true;
                            }
                        });
                        if (!authenticated) {
                            return reject(new AuthenticationError(`Illegal ${type} access.`));
                        }
                    });
                    return resolve();
                })
                .catch((e) => reject(e));
        });
    }

    private performSQLRequest(request: Request, errorHandler: Function): void {
        let c = new Connection(this.connectionConfig);
        c.connect((error) => {
            if (error) return errorHandler(error);
            c.execSql(request);
        });
    }
    private getAuth(location: DatabaseLocation, filter?: DatabaseFilter): Promise<SQLAuth[]> {
        return new Promise((resolve, reject) => {
            if (!this.config.auth) {
                return reject(new EntryNotFound());
            }
            this.getMany<DatabaseEntryObject>(location, [this.config.auth.permission], filter)
                .then((entries) => {
                    let auths: SQLAuth[] = [];
                    entries.forEach((entry) => {
                        if (!entry.object) {
                            return reject(new EntryNotFound());
                        }
                        if (!this.config.auth) return reject(new EntryNotFound());
                        auths.push(entry.object[this.config.auth?.permission.name]);
                    });

                    return resolve(auths);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    private static formatLocation(location: DatabaseLocation): string {
        return `[${location.name.split('.').join('].[')}]`;
    }
}

export class SQLAuth {
    public read?: SQLAuthObj | undefined;
    public write?: SQLAuthObj | undefined;

    constructor(read?: SQLAuthObj, write?: SQLAuthObj) {
        this.read = read;
        this.write = write;
    }
}

export enum SQLAuthType {
    READ = 'read',
    WRITE = 'write'
}

export class SQLAuthObj {
    user: string[] | undefined;
    groups: string[] | undefined;

    constructor(user?: string[], groups?: string[]) {
        this.user = user;
        this.groups = groups;
    }
}
