import { Identifier } from 'shared-utilities';
import { DatabaseConnection } from './databaseConnection';
import { DatabaseCredentials } from '../../model/database/databaseCredentials';
import { DatabaseEntryProperty } from '../../model/database/databaseEntryProperty';
import { DatabaseService } from '../../services/database/database.service';
import { DatabaseConfig } from '../../model/databaseConfig';
import { DatabaseFilter } from '../../model/database/databaseFilter';

/**
 * Abstract factory for Databases.
 *
 * @author Gregor Peters, Lennart Rak
 * @version 1.0
 */
export abstract class DatabaseFactory {
    protected _databaseConfig: DatabaseConfig;

    protected constructor(config: DatabaseConfig) {
        this._databaseConfig = config;
    }

    /**
     * @returns the instance of the {@link DatabaseService}.
     */
    public createService(config: DatabaseConfig): DatabaseService {
        return DatabaseService.getInstance(config, this);
    }

    /**
     * @returns the instance of  {@link DatabaseConnection}.
     */
    abstract createConnection(credentials: DatabaseCredentials): Promise<DatabaseConnection>;

    /**
     * Creates a {@link DatabaseFilter}, matching to the current database.
     * @param property {@link DatabaseEntryProperty} to be filtered by.
     */
    abstract createFilter(property: DatabaseEntryProperty<Identifier>): DatabaseFilter;

    /**
     * Created a {@link DatabaseConnection} with midwares {@link DatabaseCredentials}.
     * @returns Promise of the midware {@link DatabaseConnection}.
     */
    public async createMidwareConnection(): Promise<DatabaseConnection> {
        return this.createConnection(
            new DatabaseCredentials(
                this._databaseConfig.midware.credentials.name,
                this._databaseConfig.midware.credentials.password
            )
        );
    }
}
