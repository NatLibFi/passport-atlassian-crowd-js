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

import fetch from 'node-fetch';
import HttpStatus from 'http-status';
import ApiError from './error';

export default function ({url, appName, appPassword, fetchGroupMembership}) {
	const authorizationHeader = `Basic ${Buffer.from(`${appName}:${appPassword}`).toString('base64')}`;

	return {validateCredentials, fetchSessionInfo, fetchUserInfo};

	async function validateCredentials({username, password, remoteAddress}) {
		const response = await fetch(`${url}/usermanagement/1/session`, {
			method: 'POST',
			headers: {
				Authorization: authorizationHeader,
				Accept: 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				username, password,
				'validation-factors': {
					validationFactors: [{
						name: 'remote_address',
						value: remoteAddress || '127.0.0.1'
					}]
				}
			})
		});

		if (response.status === HttpStatus.CREATED) {
			return response.json();
		}

		if (HttpStatus.BAD_REQUEST === response.status) {
			throw new ApiError();
		}

		throw new Error(`${response.status}: ${await response.text()}`);
	}

	async function fetchSessionInfo({token, remoteAddress}) {
		const response = await fetch(`${url}/usermanagement/1/session/${token}`, {
			method: 'POST',
			headers: {
				Authorization: authorizationHeader,
				Accept: 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				validationFactors: [
					{
						name: 'remote_address',
						value: remoteAddress || '127.0.0.1'
					}
				]
			})
		});

		console.log('fetchSessionInfo');
		console.log(response.status);

		if ([HttpStatus.CREATED, HttpStatus.OK].includes(response.status)) {
			return response.json();
		}

		if (HttpStatus.NOT_FOUND === response.status) {
			throw new ApiError();
		}

		throw new Error(`${response.status}: ${await response.text()}`);
	}

	async function fetchUserInfo(username) {
		const response = await fetch(`${url}/usermanagement/1/user?username=${username}`, {
			headers: {
				Authorization: authorizationHeader,
				Accept: 'application/json'
			}
		});

		console.log('fetchUserInfo');
		console.log(response.status);

		if (response.status === HttpStatus.OK) {
			const userInfo = parseUserInfo(await response.json());

			if (fetchGroupMembership) {
				return {
					...userInfo,
					groups: await fetchGroups()
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

		async function fetchGroups() {
			const directGroups = await getGroups('direct');
			const nestedGroups = await getGroups('nested');

			return directGroups.concat(nestedGroups).reduce((acc, group) => {
				return acc.includes(group) ? acc : acc.concat(group);
			}, []);

			async function getGroups(context) {
				const response = await fetch(`${url}/usermanagement/1/user/group/${context}?username=${username}`, {
					headers: {
						Authorization: authorizationHeader,
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
