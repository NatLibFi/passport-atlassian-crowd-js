# Passport strategy for Atlassian Crowd  [![NPM Version](https://img.shields.io/npm/v/@natlibfi/passport-atlassian-crowd.svg)](https://npmjs.org/package/@natlibfi/passport-atlassian-crowd) [![Build Status](https://travis-ci.org/NatLibFi/passport-atlassian-crowd-js.svg)](https://travis-ci.org/NatLibFi/passport-atlassian-crowd-js)

Passport strategy for Atlassian Crowd. There have been many but this module has the following features
- Written in modern day Javascript/ECMAscript
- Supports authentication using username and password OR SSO token transparently
- Returns user data formatted as [common format and protocol for accessing contacts](https://tools.ietf.org/html/draft-smarr-vcarddav-portable-contacts-00)
- Optional fetching of user group membership

# Usage
### ES modules
```js
import passport from 'passport';
import AtlassianCrowdStrategy from '@natlibfi/passport-atlassian-crowd';

passport.use(new AtlassianCrowdStrategy({
    url: CROWD_URL, app: CROWD_APP_NAME, password: CROWD_APP_PASSWORD
}));
```
### Node.js require
```
const passport = require('passport');
const {default: AtlassianCrowdStrategy} = require('@natlibfi/passport-atlassian-crowd');

passport.use(new AtlassianCrowdStrategy({
    url: CROWD_URL, app: CROWD_APP_NAME, password: CROWD_APP_PASSWORD
}));
```
## User data format
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
## Configuration
The configuration is passed in to the class constructor in an object which supports the following properties:
- **url**: Crowd service URL
- **app** Crowd application name
- **password**: Crowd application password
- **ssoCookie** *(Optional)*: Name of the SSO cookie. Defaults to **crowd.token_key**.
- **fetchGroupMembership** *(Optional)*: Boolean indicating whether to retrieve group membership or not. Defaults to **false**.

## License and copyright

Copyright (c) 2019 **University Of Helsinki (The National Library Of Finland)**

This project's source code is licensed under the terms of **MIT license**
