# Requirements

-   Node.js
-   Camera Stream
-   SQL or LDAP Database
-   SSL certificate

# Initializing

## Database

### LDAP

At first you need to create an LDAP parent node for the Event-Subscriber and the users.

Then create the following ldap attributes:

-   endpoint
-   eventType
-   nfcToken

From these attributes you can now build the following classes:

-   doorUser (extends `inetOrgPerson`)
    -   nfcToken
-   eventSubscriber
    -   endpoint
    -   eventType
    -   displayName

#### Config

Create `./config/database/ldap.json`.

Follow the JSON schema:

```json
{
    "url": "[ldap://yourLdapServerUrl:port]",
    "midware": {
        "credentials": {
            "name": "[your LDAP admin account cn]",
            "password": "[your LDAP admin account password]"
        }
    },
    "user": {
        "location": {
            "name": "[cn of the node that contains all users]"
        },
        "nfcToken": {
            "name": "[LDAP attribute name of nfcToken]"
        },
        "name": {
            "name": "cn"
        },
        "identifier": {
            "name": "cn"
        }
    },
    "eventSubscriber": {
        "location": {
            "name": "[cn of the node that contains all eventSubscriber]"
        },
        "identifier": {
            "name": "[endpoint attribute name]"
        },
        "type": {
            "name": "objectClass",
            "value": "[eventSubscriber class name]"
        },
        "event": {
            "name": "[eventType attribute name]"
        },
        "endpoint": {
            "name": "[endpoint attribute name]"
        },
        "label": {
            "name": "displayName"
        }
    }
}
```

---

### SQL

Create 2 Tables:

-   eventSubscriber
    -   endpoint `varchar(MAX)`
    -   label `varchar(MAX)`
    -   event `varchar(MAX)`
    -   auth `varchar(MAX)`
-   user
    -   name `varchar(MAX)`
    -   password `varchar(MAX)`
    -   nfcToken `varchar(MAX)`
    -   auth `varchar(MAX)`
    -   groups `varchar(MAX)`

Create an entry for the database user too.

#### **The auth concept**

Each row has an auth entry following the json schema:

```json
{
    "read": {
        "user": ["Gregor"], // Array of users, that are allowed to read the entry.
        "groups": ["admin"] // Array of groups, whose members are allowed to read the entry
    },
    "write": {
        "user": ["Gregor"], // Array of users, that are allowed to modify or delete the entry.
        "groups": ["admin"] // Array of groups, whose members are allowed to modify or delete the entry
    }
}
```

#### **Config**

create `./config/sql.json` and follow following schema:

```json
{
    "url": "[your sqlServer url]",
    "auth": {
        "password": {
            "name": "[user password column name]"
        },
        "permission": {
            "name": "[user auth column name]"
        },
        "groups": {
            "member": {
                "name": "[user groups row name]"
            },
            "default": {
                "read": ["admin"], // default read user Groups
                "write": ["admin"] // default write user Groups
            }
        }
    },
    "midware": {
        "credentials": {
            "name": "[sql username]",
            "password": "[sql password]"
        }
    },
    "user": {
        "location": {
            "name": "[sqlServer].[database].[user Table name]"
        },
        "nfcToken": {
            "name": "[user nfcToken column name]"
        },
        "name": {
            "name": "[user name column name]"
        },
        "identifier": {
            "name": "[user name column name]"
        }
    },
    "eventSubscriber": {
        "location": {
            "name": "[sqlServer].[database].[eventSubscriber Table name]"
        },
        "identifier": {
            "name": "[eventSusbscriber identifier column name]"
        },
        "event": {
            "name": "[event column name]"
        },
        "endpoint": {
            "name": "[endpoint column name]"
        },
        "label": {
            "name": "[label column name]"
        }
    }
}
```

## Midware

### config

create `./config/default.json`

Follow the following json schema:

```json
{
    "port": 5000, // midware port
    "hostname": "localhost", // midware hostname

    "basePath": "/api",
    "userPath": "/users",
    "eventPath": "/events",
    "cameraPath": "/camera",
    "doorPath": "/door",

    "sessionMaxAge": 86400000,

    "whitelist": [
        "https://dc.local/" // add pwa here
    ],

    "doorMicrocontroller": {
        "psk": {
            "name": "psk",
            "value": "1234" // enter psk here
        },
        "endpoint": {
            "name": "[endpoint database attribut name]",
            "value": "https://192.168.178.139" // ip of microcontroller
        },
        "seed": "1234",
        "openPath": "/door/",
        "updateNfcTokenPath": "/token/",
        "deleteNfcTokenPath": "/token/",
        "getValidationPath": "/token/"
    },

    "rtspUrlH": "rtsp://administrator:test1234@192.168.178.111:554/stream1", // high res rtsp stream
    "rtspUrlL": "rtsp://administrator:test1234@192.168.178.111:554/stream2", // low res rtsp stream
    "database": "sql" // Database. Either sql or ldap.
}
```

```shell
npm install
```

if not done before, create link to shared-utilities:

```cmd
cd ../shared/utilities
npm link
```

Link shared-utilities to the project

```cmd
npm link shared-utilities
```

Generate ssl keys

```cmd
cd ./config
mkcert [insert your ip here]
```

Rename the key into `server.key` and the cert into `server.cert`

# Starting

Run

```shell
npm start
```

to start the server.
