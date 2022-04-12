import { Url } from 'shared-utilities';
import { DatabaseCredentials } from '../../model/database/databaseCredentials';
import { DatabaseEntry } from '../../model/database/databaseEntry';
import { DatabaseEntryProperty } from '../../model/database/databaseEntryProperty';
import { DatabaseFilter } from '../../model/database/databaseFilter';
import { DatabaseLocation } from '../../model/database/databaseLocation';

export abstract class DatabaseEntryObject {
    [p: string]: any;
}

/**
 * DatabaseConnection magically manages the connection to databases.
 * To allow the greatest possible flexibility, each DatabaseConnection manages its own access rights.
 */
export abstract class DatabaseConnection {
    private readonly _credentials: DatabaseCredentials;
    private _url: Url;

    protected constructor(credentials: DatabaseCredentials, url: Url) {
        this._credentials = credentials;
        this._url = url;
    }

    /**
     * Add the entry to the database at the location given through the entry.
     *
     * @param entry
     */
    public abstract create(entry: DatabaseEntry<any>): Promise<void>;

    /**
     * Returns one {@link DatabaseEntryObject} of type T.
     *
     * @param location where the method looks for the entry
     * @param properties you wish to get
     * @param filter for the search in the database
     */
    public abstract get<T extends DatabaseEntryObject>(
        location: DatabaseLocation,
        properties?: DatabaseEntryProperty<any>[],
        filter?: DatabaseFilter
    ): Promise<DatabaseEntry<T>>;

    /**
     * Returns multiple {@link DatabaseEntryObject} of type T.
     *
     * @param location where the method looks for the entry
     * @param properties you wish to get
     * @param filter for the search in the database
     */
    public abstract getMany<T extends DatabaseEntryObject>(
        location: DatabaseLocation,
        properties: DatabaseEntryProperty<any>[],
        filter?: DatabaseFilter
    ): Promise<Array<DatabaseEntry<T>>>;

    /**
     * Overwrites the property of all objects at the location, matching the filter.
     *
     * @param property property to be overwritten
     * @param location location of the object(s)
     * @param filter filters all objects at location.
     */
    public abstract setProperty(
        property: DatabaseEntryProperty<any>,
        location: DatabaseLocation,
        filter?: DatabaseFilter
    ): Promise<void>;

    /**
     * Deletes the entry at the location, matching the filter
     *
     * @param location location of the object(s)
     * @param filter to apply on the query
     */
    public abstract delete(location: DatabaseLocation, filter?: DatabaseFilter): Promise<void>;

    public get credentials(): DatabaseCredentials {
        return this._credentials;
    }

    public get url(): Url {
        return this._url;
    }
    public set url(value: Url) {
        this._url = value;
    }
}
