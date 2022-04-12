import {Password, Username} from 'shared-utilities';

/**
 * This class represents credentials for databases.
 * Databases with a non-credential login, like e.g. Windows account authentication, are not supported.
 *
 * @author Gregor Peters
 * @version 1.0
 */
export class DatabaseCredentials {
    private readonly _name: Username;
    private readonly _password: Password;

    constructor(name: Username, password: Password) {
        this._name = name;
        this._password = password;
    }

    get name(): Username {
        return this._name;
    }

    get password(): Username {
        return this._password;
    }
}
