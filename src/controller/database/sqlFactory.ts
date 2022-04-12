import { Identifier } from 'shared-utilities';
import { SqlFilter } from '../../model/database/sqlFilter';
import { DatabaseConfig } from '../../model/databaseConfig';
import { DatabaseCredentials } from '../../model/database/databaseCredentials';
import { DatabaseEntryProperty } from '../../model/database/databaseEntryProperty';
import { DatabaseFactory } from './databaseFactory';
import { SqlConnection } from './sqlConnection';
/**
 * {@link SqlFactory} produces SQL specific stuff.
 */
export class SqlFactory extends DatabaseFactory {
    constructor(config: DatabaseConfig) {
        super(config);
    }
    /**
     * Creates a {@link SqlConnection}.
     * @param credentials {@link Credentials} for {@link SqlConnection}.
     * @returns Promise of {@link SqlConnection}.
     */
    public async createConnection(credentials: DatabaseCredentials): Promise<SqlConnection> {
        const sqlConnection: SqlConnection = new SqlConnection(
            credentials,
            this._databaseConfig.url.toString(),
            this._databaseConfig
        );
        return new Promise((resolve, reject) => {
            sqlConnection
                .connect()
                .then(() => {
                    resolve(sqlConnection);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    /**
     * Creates a {@link SqlFilter}.
     * @param property {@link DatabaseEntryProperty} to be filtered by.
     * @returns The {@link SqlFilter}.
     */
    static createFilter(property: DatabaseEntryProperty<Identifier>): SqlFilter {
        return new SqlFilter(
            'WHERE ' + property.name + " = '" + JSON.stringify(property.value) + "'"
        );
    }

    /**
     * Creates a {@link SqlFilter}.
     * @param property {@link DatabaseEntryProperty} to be filtered by.
     * @returns The {@link SqlFilter}.
     */
    createFilter(property: DatabaseEntryProperty<Identifier>): SqlFilter {
        return SqlFactory.createFilter(property);
    }
}
