import { Name, Username, NfcToken, Password, Url, Identifier } from 'shared-utilities';
import { DatabaseLocation } from '../database/databaseLocation';
import { DatabaseCredentials } from '../database/databaseCredentials';
import { DatabaseEntryProperty } from '../database/databaseEntryProperty';

/**
 * Interface for our database config files
 *
 * @author Lennart Rak, Gregor Peters
 * @version
 */

export interface DatabaseConfig {
    url: Url;
    auth?: {
        password: DatabaseEntryProperty<Password>;
        permission: DatabaseEntryProperty<string>;
        groups: {
            member: DatabaseEntryProperty<string>;
            default: {
                write: string[];
                read: string[];
            };
        };
    };
    midware: {
        credentials: DatabaseCredentials;
    };
    user: {
        location: DatabaseLocation;
        nfcToken: DatabaseEntryProperty<NfcToken>;
        name: DatabaseEntryProperty<Username>;
        identifier: DatabaseEntryProperty<Identifier>;
    };
    eventSubscriber: {
        location: DatabaseLocation;
        identifier: DatabaseEntryProperty<Identifier>;
        type?: DatabaseEntryProperty<string>;
        event: DatabaseEntryProperty<Event>;
        endpoint: DatabaseEntryProperty<Url>;
        label: DatabaseEntryProperty<Name>;
    };
}
