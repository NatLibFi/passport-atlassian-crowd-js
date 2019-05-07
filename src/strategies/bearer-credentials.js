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

import Strategy from 'passport-strategy';
import {getCredentials, getRemoteAddress} from '../utils';
import ApiError from '../error';
import crowdFactory from '../crowd';

export default class extends Strategy {
	constructor({url, appName, appPassword}) {
		super();

		this.name = 'atlassian-crowd-bearer-credentials';
		this._crowdClient = crowdFactory({url, appName, appPassword});
	}

	async authenticate(req) {
		const self = this;

		try {
			const {username, password} = getCredentials(req);
			const {token} = await self._crowdClient.validateCredentials({
				username, password, remoteAddress: getRemoteAddress(req)
			});

			this.success(token);
		} catch (err) {
			if (err instanceof ApiError) {
				this.fail();
			} else {
				this.error(err);
			}
		}
	}
}
