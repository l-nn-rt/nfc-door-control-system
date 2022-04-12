import { Identifier } from 'shared-utilities';
import { DatabaseCredentials } from '../../model/database/databaseCredentials';
import { DatabaseEntryProperty } from '../../model/database/databaseEntryProperty';
import { DatabaseFactory } from './databaseFactory';
import { LdapConnection } from './ldapConnection';
import { DatabaseConfig } from '../../model/databaseConfig';
import { LdapFilter } from '../../model/database/ldapFilter';
import { DatabaseConnection } from './databaseConnection';

const ldapEscape = require('ldap-escape');
/**
 * {@link LdapFactory} produces LDAP specific stuff.
 */
export class LdapFactory extends DatabaseFactory {
    constructor(config: DatabaseConfig) {
        super(config);
    }

    /**
     * Creates a {@link LdapConnection}.
     * @param credentials {@link Credentials} for {@link LdapConnection}.
     * @returns Promise of {@link LdapConnection}.
     */
    public async createConnection(credentials: DatabaseCredentials): Promise<DatabaseConnection> {
        const ldapConnection = new LdapConnection(
            credentials,
            this._databaseConfig.url.toString(),
            this._databaseConfig
        );
        return new Promise((resolve, reject) => {
            ldapConnection.ready
                .then(() => {
                    resolve(ldapConnection as DatabaseConnection);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    /**
     * Creates a {@link LdapFilter}.
     * @param property {@link DatabaseEntryProperty} to be filtered by.
     * @returns The {@link LdapFilter}.
     */
    createFilter(property: DatabaseEntryProperty<Identifier>): LdapFilter {
        return new LdapFilter('(' + property.name + '=' + property.value + ')');
    }
}
