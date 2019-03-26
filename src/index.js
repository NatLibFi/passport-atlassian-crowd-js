/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* Copyright 2019 University Of Helsinki (The National Library Of Finland)
*
* Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*
* @licend  The above is the entire license notice
* for the JavaScript code in this file.
*
*/

import createDebugLogger from 'debug';
import fetch from 'node-fetch';
import HttpStatus from 'http-status';
import Strategy from 'passport-strategy';

export default class extends Strategy {
	constructor({url, app, password, ssoCookie = 'crowd.token_key', fetchGroupMembership = false}) {
		super();

		this.name = 'atlassian-crowd';

		this._debug = createDebugLogger('@natlibfi/passport-atlassian-crowd');
		this._url = url;
		this._app = app;
		this._ssoCookie = ssoCookie;
		this._authorizationHeader = `Basic ${Buffer.from(`${app}:${password}`).toString('base64')}`;
		this._fetchGroupMembership = fetchGroupMembership;
	}

	async authenticate(req) {
		const self = this;

		try {
			const token = getToken();

			if (token) {
				const username = await validateSession(token, req);

				if (username) {
					this.success(await getUserInfo(username));
				} else {
					this.fail();
				}
			} else {
				const {username, password} = getCredentials();

				if (await validateCredentials(username, password, req)) {
					this.success(await getUserInfo(username));
				} else {
					this.fail();
				}
			}
		} catch (err) {
			this.error(err);
		}

		function getToken() {
			if (req.headers.cookie) {
				const cookie = req.headers.cookie
					.split(/;/)
					.map(str => {
						const [name, value] = str.split(/=/); // eslint-disable-line no-div-regex
						return {name, value};
					})
					.find(({name}) => name === self._ssoCookie);

				if (cookie) {
					return cookie.value;
				}
			}
		}

		function getCredentials() {
			if (req.headers.authorization) {
				const encoded = req.headers.authorization.replace(/^Basic /, '');
				const [username, password] = Buffer.from(encoded, 'base64').toString().split(/:/);
				return {username, password};
			}

			return {};
		}

		async function validateSession(token, req) {
			const response = await fetch(`${self._url}/usermanagement/1/session/${token}`, {
				method: 'POST',
				headers: {
					Authorization: self._authorizationHeader,
					Accept: 'application/json',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					validationFactors: [
						{
							name: 'remote_address',
							value: req.socket ? req.socket.remoteAddress : '127.0.0.1'
						}
					]
				})
			});

			if (response.status === HttpStatus.OK) {
				const payload = await response.json();
				return payload.user.name;
			}

			self._debug(`${response.status}: ${await response.text()}`);

			return false;
		}

		async function validateCredentials(username, password) {
			const response = await fetch(`${self._url}/usermanagement/1/session`, {
				method: 'POST',
				headers: {
					Authorization: self._authorizationHeader,
					Accept: 'application/json',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					username, password,
					'validation-factors': {
						validationFactors: [{
							name: 'remote_address',
							value: req.socket ? req.socket.remoteAddress : '127.0.0.1'
						}]
					}
				})
			});

			if (response.status === HttpStatus.CREATED) {
				return true;
			}

			self._debug(`${response.status}: ${await response.text()}`);

			return false;
		}

		async function getUserInfo(username) {
			const response = await fetch(`${self._url}/usermanagement/1/user?username=${username}`, {
				headers: {
					Authorization: self._authorizationHeader,
					Accept: 'application/json'
				}
			});

			if (response.status === HttpStatus.OK) {
				const userInfo = parseUserInfo(await response.json());

				if (self._fetchGroupMembership) {
					return {
						...userInfo,
						groups: await fetchGroupMembership()
					};
				}

				return userInfo;
			}

			throw new Error(`${response.status}: ${await response.text()}`);

			/* Returns contact schema compliant profile: https://tools.ietf.org/html/draft-smarr-vcarddav-portable-contacts-00 */
			function parseUserInfo(payload) {
				return {
					id: payload.name,
					name: {
						givenName: payload['first-name'],
						familyName: payload['last-name']
					},
					displayName: payload['display-name'],
					emails: [{value: payload.email, type: 'work'}],
					organization: []
				};
			}

			async function fetchGroupMembership() {
				const directGroups = await getGroups('direct');
				const nestedGroups = await getGroups('nested');

				return directGroups.concat(nestedGroups).reduce((acc, group) => {
					return acc.includes(group) ? acc : acc.concat(group);
				}, []);

				async function getGroups(context) {
					const response = await fetch(`${self._url}/usermanagement/1/user/group/${context}?username=${username}`, {
						headers: {
							Authorization: self._authorizationHeader,
							Accept: 'application/json'
						}
					});

					if (response.status === HttpStatus.OK) {
						const payload = await response.json();
						return payload.groups.map(g => g.name);
					}

					throw new Error(`${response.status}: ${await response.text()}`);
				}
			}
		}
	}
}
