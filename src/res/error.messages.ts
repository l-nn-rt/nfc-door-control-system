import { Dictionary } from '../model/dictionary.model';

export const ERROR_MESSAGES: Dictionary = {
    PSK_MISSING: {
        EN: 'Pre-shared key is missing.'
    },
    PSK_INVALID: {
        EN: 'Pre-shared key is invalid.'
    },
    SESSION_INVALID: {
        EN: 'Your session is invalid.'
    },
    CREDENTIALS_MISSING: {
        EN: 'Missing credentials.'
    },
    CREDENTIALS_INVALID: {
        EN: 'Invalid credentials.'
    },
    FATAL: {
        EN: 'A fatal error occurred.'
    },
    NOT_IMPLEMENTED: {
        EN: 'Method not implemented.'
    },
    UNKNOWN: {
        EN: 'Unknown Error.'
    },
    REACH_DATABASE: {
        EN: 'Cant connect to database, please try again later.'
    },
    INTERNAL_SERVER_ERROR: {
        EN: 'An internal error occurred on the server.'
    },
    INVALID_LOGIN_CREDENTIALS: {
        EN: 'Login credentials are invalid.'
    },
    DOOR_REACH: {
        EN: 'Cannot connect to the door sorry :(.'
    },
    ENTRY_NOT_FOUND: {
        EN: 'The searched entry was not found.'
    },
    CANNOT_FIND_FIELD_USERNAME: {
        EN: 'Internal Server Error: Can not find field usernames in database.'
    },
    CANNOT_FIND_FIELD_NFC_TOKEN: {
        EN: 'Internal Server Error: Can not find field nfc token in database.'
    },
    DATABASE_SET: {
        EN: 'An error occurred while trying to set new Properties.'
    },
    DATABASE_DELETE: {
        EN: 'An error occurred while trying to delete entry.'
    },
    DATABASE_ENTRY_NOT_FOUND: {
        EN: 'Entry not found.'
    },
    INIT_ARGS_MANDATORY: {
        EN: 'Arguments mandatory, when called initially.'
    },
    LDAP_DN: {
        EN: 'An error occurred during fetching dns.'
    },
    LDAP_UNKNOWN: {
        EN: 'No error for LDAP error code '
    },
    IDENTIFIER_TYPE_MANDATORY: {
        EN: 'Identifier and type mandatory.'
    },
    DATABASE_USERNAME: {
        EN: 'Username invalid.'
    },
    PROPERTY_MANDATORY: {
        EN: 'There has to be a property to fetch.'
    },
    DATABASE_ERROR_MESSAGE: {
        EN: 'database error message'
    }
};
