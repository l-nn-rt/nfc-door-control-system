import {DatabaseEntryProperty} from './databaseEntryProperty';
import {DatabaseLocation} from './databaseLocation';
import {Identifier} from 'shared-utilities';

/**
 * DatabaseEntry represents an entry of a database.
 * Each Entry has a location such as SQL-Table or LDAP-DN.
 * Sometimes there is a unique identifier.
 *
 *  @author Gregor Peters
 *  @version 1.0
 */
export class DatabaseEntry<T extends Object> {
    private readonly _location: DatabaseLocation;
    private readonly _object?: T;
    private readonly _identifier?: DatabaseEntryProperty<Identifier>;
    private readonly _type?: DatabaseEntryProperty<string>;

    constructor(
        location: DatabaseLocation,
        object?: T,
        identifier?: DatabaseEntryProperty<Identifier>,
        type?: DatabaseEntryProperty<string>
    ) {
        this._location = location;
        this._object = object;
        this._identifier = identifier;
        this._type = type;
    }

    get type(): DatabaseEntryProperty<string> | undefined {
        return this._type;
    }

    get location(): DatabaseLocation {
        return this._location;
    }

    public get identifier(): DatabaseEntryProperty<Identifier> | undefined {
        return this._identifier;
    }

    get object(): T | undefined {
        return this._object;
    }
}
