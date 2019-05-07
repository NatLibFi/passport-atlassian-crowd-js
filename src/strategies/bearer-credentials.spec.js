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

import chai, {expect} from 'chai';
import chaiPassportStrategy from 'chai-passport-strategy';
import nock from 'nock';
import fixturesFactory from '@natlibfi/fixura';
import Strategy from './bearer-credentials';

chai.use(chaiPassportStrategy);

describe('strategies/bearer-credentials', () => {
	const {getFixture} = fixturesFactory({
		root: [__dirname, '..', '..', 'test-fixtures', 'strategies', 'bearer-credentials']
	});

	afterEach(() => {
		nock.cleanAll();
	});

	it('Should call fail() because of invalid credentials', async () => {
		nock('https://crowd/usermanagement/1/session')
			.post(/.*/).reply(400);

		const strategy = new Strategy({
			url: 'https://crowd', appName: 'foo', appPassword: 'bar'
		});

		return new Promise((resolve, reject) => {
			chai.passport.use(strategy)
				.success(() => reject(new Error('Should not call success()')))
				.error(err => reject(new Error(`Should not call error(): ${err.stack}`)))
				.fail(resolve)
				.authenticate();
		});
	});

	it('Should succeed because of valid credentials', (index = '1') => {
		const createSessionResponse = getFixture([index, 'createSessionResponse.json']);
		const fetchUserResponse = getFixture([index, 'fetchUserResponse.json']);
		const token = getFixture([index, 'token.txt']);

		nock('https://crowd')
			.post('/usermanagement/1/session').reply(201, createSessionResponse)
			.get('/usermanagement/1/user?username=foobar').reply(200, fetchUserResponse);

		const strategy = new Strategy({
			url: 'https://crowd', appName: 'foo', appPassword: 'bar',
			ssoCookie: 'foo'
		});

		return new Promise((resolve, reject) => {
			chai.passport.use(strategy)
				.fail(() => reject(new Error('Should not call fail()')))
				.error(err => reject(new Error(`Should not call error(): ${err.stack}`)))
				.success(user => {
					try {
						expect(user).to.equal(token);
						resolve();
					} catch (err) {
						reject(err);
					}
				})
				.req(req => {
					req.headers.authorization = `Basic ${Buffer.from('foobar:barfoo').toString('base64')}`;
				})
				.authenticate();
		});
	});

	it('Should call error() because of unexpected error', async () => {
		nock('https://crowd/usermanagement/1/session')
			.post(/.*/).reply(500);

		const strategy = new Strategy({
			url: 'https://crowd', appName: 'foo', appPassword: 'bar'
		});

		return new Promise((resolve, reject) => {
			chai.passport.use(strategy)
				.success(() => reject(new Error('Should not call success()')))
				.fail(() => reject(new Error('Should not call fail()')))
				.error(resolve)
				.authenticate();
		});
	});
});
