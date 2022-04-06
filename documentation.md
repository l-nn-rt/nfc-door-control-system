# API Documentation

- [User](#users) related endpoints
    - [Get](#get-all-usernames) all usernames
    - [Login](#login) the user
    - [Logout](#logout) the user
    - [Set nfcToken](#set-nfctoken) of the user
    - [Delete nfcToken](#delete-nfctoken) of the user
- [Event subscriber](#event-subscriber) related endpoints
  - [Notify](#notify) all event-subscriber
  - [Add event subscriber](#add-event-subscriber)
  - [Delete event subscriber](#delete-event-subscriber)
  - [Get event subscriber](#get-event-subscriber)
- [Door](#door) related endpoints
  - [Open](#open) the door
  - [Refresh](#refresh) the data at the door microcontroller
- [Camera](#camera) related endpoints
  - [Connection](#connection) endpoint provides websocket url
- [Notification](#notification) related endpoints.
  - [Add](#push-subscription) a new subscription.

# Users

## Get all usernames

Used to get all usernames.

**URL:** `/api/users/`

**Method:** `GET`

**Authentication required:** Only session

**Data constraints** `{}`

**Data example** `{}`

### Success Response

**Condition** Everything is OK

**Code** `200 OK`

**Content:**

```json
{
  "usernames": [
    "Gregor",
    "Lennart",
    "Alex",
    "David",
    "Tom"
  ]
}
```

### Error response

**Condition:** Database is offline

**Code:** `562 REACH DATABASE`

**Content example:**

```json
{
  "error": {
    "message": "Cant connect to database, please try again later."
  }
}
```

**Condition:** Session is invalid

**Code:** `485 SESSION INVALID`

**Content example:**

```json
{
  "error": {
    "message": "Your session is invalid."
  }
}
```

## Login

Used to log in the user and gain a session cookie.

**URL:** `/api/users/login/`

**Method:** `POST`

**Authentication required:** No

**Data constraints**

| Name     | Description                       | Type   | Optional |
| -------- | --------------------------------- | ------ | -------- |
| username | The username of the users account | String | ❌       |
| password | The password of the users account | String | ❌       |

**Data example:**

```json
{
  "username": "alex",
  "password": "ich hoffe ich vergesse es nicht"
}
```

### Success Response

**Condition:** Everything is OK

**Code:** `200 OK`

**Content:**

```json
{}
```

### Error Response

**Condition:** Username or password is empty

**Code:** `490 MISSING INPUT`

**Content example:**

```json
{
  "error": {
    "message": {
      "username": "This field is required",
      "password": "This field is required"
    }
  }
}
```

---

**Condition:** Database don't know the username password combination

**Code:** `470 INVALID CREDENTIALS`

**Content example:**

```json
{
  "error": {
    "message": "Login credentials are invalid."
  }
}
```

---

**Condition:** Database is offline

**Code:** `562 REACH DATABASE`

**Content example:**

```json
{
  "error": {
    "message": "Cant connect to database, please try again later."
  }
}
```

## Logout

Logs the user out and makes his session cookie invalid.

**URL:** `/api/users/logout/`

**Method:** `POST`

**Authentication required:** Yes

**Data constraints:** `{}`

### Success Response

**Condition:** Everything is OK

**Code:** `200 OK`

**Content:** `{}`

### Error Response

**Condition:** User was not authenticated

**Code:** `485 INVALID SESSION`

**Content example:**

```json
{
  "error": {
    "message": "Your session is invalid."
  }
}
```

## Set nfcToken

Used to set the nfcToken of an user.

**URL:** `/api/users/[username]/nfcToken`

**Method:** `POST`

**Authentication required:** Yes

**Data constraints**

| Name     | Description         | Type   | Optional |
| -------- | ------------------- | ------ | -------- |
| nfcToken | The token to be set | String | ❌       |

**Data example:**

```json
{
  "nfcToken": "0123456"
}
```

### Success Response

**Condition:** Everything is OK

**Code:** `200 OK`

**Content:**

```json
{
  "nfcToken": "hashedNfcToken"
}
```

### Error Response

**Condition:** Door unreachable

**Code:** `560 REACH DOOR`

**Content example:**

```json
{
  "nfcToken": "hashedNfcToken"
}
```

---

**Condition:** Database is offline

**Code:** `562 REACH DATABASE`

**Content example:**

```json
{
  "error": {
    "message": "Cant connect to database, please try again later."
  }
}
```

---

**Condition:** Session is invalid

**Code:** `485 SESSION INVALID`

**Content example:**

```json
{
  "error": {
    "message": "Your session is invalid."
  }
}
```

---

**Condition:** Basic Auth is invalid

**Code:** `401 UNAUTHORIZED`

**Content example:**

**Header:**

| Name     | Value               |
| -------- |---------------------|
| WWW-Authenticate | Basic realm="Please log in."  |

**Body:**

```json
{}
```

## Delete nfcToken

Used to delete the nfcToken of an user.

**URL:** `/api/users/[username]/nfcToken`

**Method:** `DELETE`

**Authentication required:** Yes

**Data constraints** `{}`

**Data example:**

```json
{}
```

### Success Response

**Condition:** Everything is OK

**Code:** `200 OK`

**Content:**

```json
{}
```

### Error Response

**Condition:** Database is offline

**Code:** `562 REACH DATABASE`

**Content example:**

```json
{
  "error": {
    "message": "Cant connect to database, please try again later."
  }
}
```

---

**Condition:** Session is invalid

**Code:** `485 SESSION INVALID`

**Content example:**

```json
{
  "error": {
    "message": "Your session is invalid."
  }
}
```

---

**Condition:** Basic Auth is invalid

**Code:** `401 UNAUTHORIZED`

**Content example:**

**Header:**

| Name     | Value               |
| -------- |---------------------|
| WWW-Authenticate | Basic realm="Please log in."  |

**Body:**

```json
{}
```


# Event subscriber
## Notify
Notifies all event subscribers matching the event type and if it rings the bell also the pwa subscribers get notified.

**URL:** `/api/event/`

**Method:** `POST`

**Authentication required:** Yes

**Data constraints:**
Provide type of the event

| Name | Description       | Type   | Optional |
| ---- | ----------------- | ------ | -------- |
| type | Type of the event | string | ❌        |

**Data example:**
```json
{
    "type":"BELL_RUNG"
}
```

### Success Response
**Condition:** Everything is OK

**Code:** `200 OK`

**Content:**

```json
{
  "msg": "3/3 got notified"
}
```

### Error Response
**Condition:** Username or password is empty

**Code:** `490 MISSING INPUT`

**Content example:**

```json
{
  "error": {
    "message": {
      "type": "This field is required"
    }
  }
}
```

## Add event subscriber

Creates a new event subscriber
**URL:** `/api/event/subscribers/`

**Method:** `POST`

**Authentication required:** Yes

**Data constraints:**

Provide ip of the event-subscriber

| Name       | Description                             | Type   | Optional |
| ---------- | --------------------------------------- | ------ | -------- |
| endpoint   | REST-Endpoint of the event-subscriber   | String | ❌        |
| label      | Label of the event-subscriber           | String | ✔️        |
| event-type | Event by which the subscriber is called | String | ❌        |

**Data example:**
```json
{
    "endpoint": "127.0.0.1/mattermost-bot/",
    "label": "Mattermost Bot",
    "type": "BELL_RUNG"
}
```
### Success Response
**Condition:** Everything is OK and there was no duplicate endpoints

**Code**: `200 OK`

**Content example:**

```json
{
  "msg": "Successfully added eventSubscriber"
}
```

### Error Response

**Condition:** Type or Endpoint empty

**Code:** `490 MISSING INPUT`

**Content example:**

```json
{
  "error": {
    "message": {
      "endpoint": "This field is required"
    }
  }
}
```
**Condition:** Database is offline

**Code:** `562 REACH DATABASE`

**Content example:**

```json
{
  "error": {
    "message": "Cant connect to database, please try again later."
  }
}
```

---

**Condition:** Session is invalid

**Code:** `485 SESSION INVALID`

**Content example:**

```json
{
  "error": {
    "message": "Your session is invalid."
  }
}
```

---

**Condition:** Basic Auth is invalid

**Code:** `401 UNAUTHORIZED`

**Content example:**

**Header:**

| Name     | Value               |
| -------- |---------------------|
| WWW-Authenticate | Basic realm="Please log in."  |

**Body:**

```json
{}
```

## Delete event subscriber

Deletes a new event subscriber

**URL:** `/api/event/subscribers/`

**Method:** `DELETE`

**Authentication required:** Yes

**Data constraints:**

Provide ip of the event-subscriber

| Name       | Description                             | Type   | Optional |
| ---------- | --------------------------------------- | ------ | -------- |
| endpoint   | REST-Endpoint of the event-subscriber   | String | ❌        |

**Data example:**
```json
{
    "endpoint": "127.0.0.1/mattermost-bot/"
}
```
### Success Response
**Condition:** Everything is OK and there was no duplicate endpoints

**Code**: `200 OK`

**Content example:**

```json
{
  "msg": "Successfully added eventSubscriber"
}
```

### Error Response

**Condition:** Event or Endpoint empty

**Code:** `490 MISSING INPUT`

**Content example:**

```json
{
  "error": {
    "message": {
      "event": "This field is required"
    }
  }
}
```
**Condition:** Database is offline

**Code:** `562 REACH DATABASE`

**Content example:**

```json
{
  "error": {
    "message": "Cant connect to database, please try again later."
  }
}
```

---

**Condition:** Session is invalid

**Code:** `485 SESSION INVALID`

**Content example:**

```json
{
  "error": {
    "message": "Your session is invalid."
  }
}
```

---

**Condition:** Basic Auth is invalid

**Code:** `401 UNAUTHORIZED`

**Content example:**

**Header:**

| Name     | Value               |
| -------- |---------------------|
| WWW-Authenticate | Basic realm="Please log in."  |

**Body:**

```json
{}
```

## Get event subscriber
Get all event subscriber

**URL:** `/api/event/subscribers/`

**Method:** `GET`

**Authentication required:** Yes

**Data constraints:**

**Data example:**
```json
{
}
```
### Success Response
**Condition:** Everything is OK and there was no duplicate endpoints

**Code**: `200 OK`

**Content example:**

```json
{
  "eventSubscribers": [
    {
      "label": "Mattermostbot",
      "endpoint": "127.0.0.1/bot",
      "type": "BELL_RUNG"
    }
  ]
}
```

### Error Response

**Condition:** Database is offline

**Code:** `562 REACH DATABASE`

**Content example:**

```json
{
  "error": {
    "message": "Cant connect to database, please try again later."
  }
}
```

---

**Condition:** Session is invalid

**Code:** `485 SESSION INVALID`

**Content example:**

```json
{
  "error": {
    "message": "Your session is invalid."
  }
}
```

# Door
## Open
Sends an open request to the door

**URL:** `/api/door/open/`

**Method:** `POST`

**Authentication required:** Yes

**Data constraints:**
**Data example:**
```json
{
}
```
### Success Response
**Condition:** Everything is OK the door was opened

**Code**: `200 OK`

**Content example:**

```json
{
}
```

### Error Response

**Condition:** Timeout on door

**Code:** `560 DOOR REACH`

**Content example:**

```json
{
  "error": {
    "message": "Cannot connect to the door sorry :(."
  }
}
```
---

**Condition:** Session is invalid

**Code:** `485 SESSION INVALID`

**Content example:**

```json
{
  "error": {
    "message": "Your session is invalid."
  }
}
```

## Refresh
Checks whether door is up to date and eventually updates door.

**URL:** `/api/door/refresh/`

**Method:** `POST`

**Authentication required:** Yes

**Data constraints:**
**Data example:**
```json
{
}
```
### Success Response
**Condition:** Everything is OK

**Code**: `200 OK`

**Content example:**

```json
{
}
```

### Error Response

**Condition:** Timeout on door

**Code:** `560 DOOR REACH`

**Content example:**

```json
{
  "error": {
    "message": "Cannot connect to the door sorry :(."
  }
}
```
---

**Condition:** Session is invalid

**Code:** `485 SESSION INVALID`

**Content example:**

```json
{
  "error": {
    "message": "Your session is invalid."
  }
}
```
# Camera

## connection
Returns the url to livestream websocket.

**URL:** `/api/camera/connection?quality=[sd or hd]`

**Method:** `GET`

**Authentication required:** No

**Data constraints:**
**Data example:**
```json
{
}
```
### Success Response
**Condition:** Everything is OK

**Code**: `200 OK`

**Content example:**

```json
{
  "url": "https://url"
}
```
# Notifiaction

## Push subscription
Push new notification subscription.

**URL:** `/api/push/subscription/`

**Method:** `POST`

**Authentication required:** Yes

**Data constraints:**
**Data example:**
```json
{
  "endpoint": "endpoint/asd",
    "keys": {
        "p256dh": "foo",
        "auth": "bar"
    }
}
```
### Success Response
**Condition:** Everything is OK

**Code**: `201 CREATED`

**Content example:**

```json
{
  "endpoint": "endpoint/asd",
    "keys": {
        "p256dh": "foo",
        "auth": "bar"
    }
}
```

### Error Response

**Condition:** endpoint or keys is empty or incomplete

**Code:** `490 MISSING INPUT`

**Content example:**

```json
{
  "error": {
    "message": {
      "endpoint": "This field is required",
      "keys.p256dh": "This field is required",
      "keys.auth": "This field is required"
    }
  }
}
```