# Passport strategies for Atlassian Crowd  [![NPM Version](https://img.shields.io/npm/v/@natlibfi/passport-atlassian-crowd.svg)](https://npmjs.org/package/@natlibfi/passport-atlassian-crowd) [![Build Status](https://travis-ci.org/NatLibFi/passport-atlassian-crowd-js.svg)](https://travis-ci.org/NatLibFi/passport-atlassian-crowd-js)

Passport strategies for Atlassian Crowd. There have been many but this module has the following features
- Written in modern day Javascript/ECMAscript
- Supports HTTP Basic authentication using username and password OR SSO token transparently
- Supports HTTP Bearer authentication using Crowd session tokens as bearer tokens
- Returns user data formatted as [common format and protocol for accessing contacts](https://tools.ietf.org/html/draft-smarr-vcarddav-portable-contacts-00)
- Optional fetching of user group membership

# Strategies
This module provides the following Passport strategies
## Basic
Authenticates user based on Crowd credentials passed in as Basic HTTP authorization header or Crowd session cookie.
## Bearer
HTTP Bearer authentication works by first retrieving a token by using credentials and then using that token in further requests.
### Credentials
Used to authenticate using credentials and creating bearer token.
### Token
Used to authenticate using bearer token.

# Usage
## Importing modules
### ES modules
```js
import {BasicStrategy} from '@natlibfi/passport-atlassian-crowd';
```
### Node.js require
```
const {BasicStrategy} = require('@natlibfi/passport-atlassian-crowd');
```
## Basic strategy
### Example
```
import express from 'express';
import passport from 'passport';
import {BasicStrategy} from '@natlibfi/passport-atlassian-crowd';

const app = express();

app.use(passport.initialize());

passport.use(new BasicStrategy({
    url: CROWD_URL, app: CROWD_APP_NAME, password: CROWD_APP_PASSWORD
}));

app.get('/foo', passport.authenticate('atlassian-crowd-basic', {session: false}));
```
### Configuration
The configuration is passed in to the class constructor in an object which supports the following properties:
- **url**: Crowd service URL
- **app** Crowd application name
- **password**: Crowd application password
- **ssoCookie** *(Optional)*: Name of the SSO cookie. Defaults to **crowd.token_key**.
- **fetchGroupMembership** *(Optional)*: Boolean indicating whether to retrieve group membership or not. Defaults to **false**.
## Bearer strategies
### Example
```
import express from 'express';
import passport from 'passport';
import {BearerCredentialsStrategy, BearerTokenStrategy} from '@natlibfi/passport-atlassian-crowd';

const app = express();

app.use(passport.initialize());

passport.use(new BearerCredentialsStrategy({
    url: CROWD_URL, app: CROWD_APP_NAME, password: CROWD_APP_PASSWORD
}));

passport.use(new BearerTokenStrategy({
    url: CROWD_URL, app: CROWD_APP_NAME, password: CROWD_APP_PASSWORD
}));

app.post('/auth', passport.authenticate('atlassian-crowd-bearer-credentials', {session: false}));
app.get('/foo', passport.authenticate('atlassian-crowd-bearer-token', {session: false}));
```
### Configuration
The configuration is passed in to the class constructor in an object which supports the following properties:
#### Credentials
- **url**: Crowd service URL
- **app** Crowd application name
- **password**: Crowd application password

#### Token
- **url**: Crowd service URL
- **app** Crowd application name
- **password**: Crowd application password
- **fetchGroupMembership** *(Optional)*: Boolean indicating whether to retrieve group membership or not. Defaults to **false**.
- **useCache** (*Optional)*: Boolean indicating whether to cache tokens and user information. Cache entries will only be removed when token expires. Defaults to **false**.
# User data format
```js
{
  id: '<name>',
  name: {
    givenName: '<first-name>',
	familyName: '<last-name>'
  },
  displayName: '<display-name>',
  emails: [{value: '<payload.email>', type: 'work'}],
  organization: []
}
```
And with `fetchGroupMembership` set to true:
```js
{
  id: '<name>',
  name: {
    givenName: '<first-name>',
	familyName: '<last-name>'
  },
  displayName: '<display-name>',
  emails: [{value: '<payload.email>', type: 'work'}],
  organization: [],
  groups: [
      'foo',
      'bar'
  ]
}
```

## License and copyright

Copyright (c) 2019 **University Of Helsinki (The National Library Of Finland)**

This project's source code is licensed under the terms of **MIT license**
