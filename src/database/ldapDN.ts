import { DatabaseLocation } from './databaseLocation';
/**
 * This class represents the LDAP distinguished name.
 */
export class LdapDN implements DatabaseLocation {
    private _dn;

    constructor(dn: string) {
        this._dn = dn;
    }

    get name() {
        return this._dn;
    }

    set name(dn: string) {
        this._dn = dn;
    }
}
