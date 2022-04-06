/**
 * This interface represents the location of an object, stored in a database.
 * In the SQL context this would be the table name,
 * in LDAP it is the DN of the entry or that of an entry from a higher hierarchy level.
 */
export interface DatabaseLocation {
    name: string;
}
