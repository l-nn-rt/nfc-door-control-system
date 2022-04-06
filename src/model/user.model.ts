import { Username, NfcToken, Identifier } from 'shared-utilities';

/**
 * User Model. Each user has a username, identifier and nfc token
 *
 * @author Lennart Rak
 * @version 1.0
 */
export class User {
    private _username?: Username;
    private _nfcToken?: NfcToken;
    private readonly _identifier: Identifier;

    public constructor(identifier: Identifier, username?: Username, token?: NfcToken) {
        this._identifier = identifier;
        this._username = username;
        this._nfcToken = token;
    }

    json(): Object {
        return {
            username: this.username,
            NfcToken: this.nfcToken
        };
    }

    get username(): Username | undefined {
        return this._username;
    }

    set username(value: Username | undefined) {
        this._username = value;
    }

    get identifier(): Identifier {
        return this._identifier;
    }

    set identifier(identifier: Identifier) {
        this._username = identifier;
    }

    get nfcToken(): NfcToken | undefined {
        return this._nfcToken;
    }

    set nfcToken(value: NfcToken | undefined) {
        this._nfcToken = value;
    }
}
