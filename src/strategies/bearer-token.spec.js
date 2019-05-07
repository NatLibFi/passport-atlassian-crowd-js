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
import fixturesFactory, {READERS} from '@natlibfi/fixura';
import Strategy, {__RewireAPI__ as RewireAPI} from './bearer-token'; // eslint-disable-line import/named

chai.use(chaiPassportStrategy);

describe('strategies/bearer-token', () => {
	const {getFixture} = fixturesFactory({
		root: [__dirname, '..', '..', 'test-fixtures', 'strategies', 'bearer-token']
	});

	afterEach(() => {
		nock.cleanAll();
		RewireAPI.__ResetDependency__('moment');
	});

	it('Should call fail() because of invalid token', async () => {
		nock('https://crowd/usermanagement/1/session/foo')
			.post(/.*/).reply(404);

		const strategy = new Strategy({
			url: 'https://crowd', appName: 'foo', appPassword: 'bar'
		});

		return new Promise((resolve, reject) => {
			chai.passport.use(strategy)
				.success(() => reject(new Error('Should not call success()')))
				.error(err => reject(new Error(`Should not call error(): ${err.stack}`)))
				.fail(resolve)
				.req(req => {
					req.headers.authorization = 'Bearer foo';
				})
				.authenticate();
		});
	});

	it('Should succeed because of valid token', (index = '1') => {
		const fetchSessionResponse = getFixture([index, 'fetchSessionResponse.json']);
		const fetchUserResponse = getFixture([index, 'fetchUserResponse.json']);
		const userInfo = getFixture({components: [index, 'userInfo.json'], reader: READERS.JSON});

		nock('https://crowd')
			.post('/usermanagement/1/session/foo').reply(201, fetchSessionResponse)
			.get('/usermanagement/1/user?username=foobar').reply(200, fetchUserResponse);

		const strategy = new Strategy({
			url: 'https://crowd', appName: 'foo', appPassword: 'bar'
		});

		return new Promise((resolve, reject) => {
			chai.passport.use(strategy)
				.fail(() => reject(new Error('Should not call fail()')))
				.error(err => reject(new Error(`Should not call error(): ${err.stack}`)))
				.success(user => {
					try {
						expect(user).to.eql(userInfo);
						resolve();
					} catch (err) {
						reject(err);
					}
				})
				.req(req => {
					req.headers.authorization = 'Bearer foo';
				})
				.authenticate();
		});
	});

	it('Should succeed because of valid token (Retrieve groups)', (index = '2') => {
		const fetchSessionResponse = getFixture([index, 'fetchSessionResponse.json']);
		const fetchUserResponse = getFixture([index, 'fetchUserResponse.json']);
		const fetchDirectGroupsResponse = getFixture([index, 'fetchDirectGroupsResponse.json']);
		const fetchNestedGroupsResponse = getFixture([index, 'fetchNestedGroupsResponse.json']);
		const userInfo = getFixture({components: [index, 'userInfo.json'], reader: READERS.JSON});

		nock('https://crowd')
			.post('/usermanagement/1/session/foo').reply(201, fetchSessionResponse)
			.get('/usermanagement/1/user?username=foobar').reply(200, fetchUserResponse)
			.get('/usermanagement/1/user/group/direct?username=foobar').reply(200, fetchDirectGroupsResponse)
			.get('/usermanagement/1/user/group/nested?username=foobar').reply(200, fetchNestedGroupsResponse);

		const strategy = new Strategy({
			url: 'https://crowd', appName: 'foo', appPassword: 'bar', fetchGroupMembership: true
		});

		return new Promise((resolve, reject) => {
			chai.passport.use(strategy)
				.fail(() => reject(new Error('Should not call fail()')))
				.error(err => reject(new Error(`Should not call error(): ${err.stack}`)))
				.success(user => {
					try {
						expect(user).to.eql(userInfo);
						resolve();
					} catch (err) {
						reject(err);
					}
				})
				.req(req => {
					req.headers.authorization = 'Bearer foo';
				})
				.authenticate();
		});
	});

	it('Should succeed because of valid token', async (index = '3') => {
		RewireAPI.__Rewire__('moment', () => ({
			isAfter: () => false
		}));

		const fetchSessionResponse = getFixture([index, 'fetchSessionResponse.json']);
		const fetchUserResponse = getFixture([index, 'fetchUserResponse.json']);
		const userInfo = getFixture({components: [index, 'userInfo.json'], reader: READERS.JSON});

		nock('https://crowd')
			.post('/usermanagement/1/session/foo').reply(201, fetchSessionResponse)
			.get('/usermanagement/1/user?username=foobar').reply(200, fetchUserResponse);

		const strategy = new Strategy({
			url: 'https://crowd', appName: 'foo', appPassword: 'bar', useCache: true
		});

		const passportHelper = chai.passport.use(strategy);

		await new Promise((resolve, reject) => {
			passportHelper
				.fail(() => reject(new Error('Should not call fail()')))
				.error(err => reject(new Error(`Should not call error(): ${err.stack}`)))
				.success(user => {
					try {
						expect(user).to.eql(userInfo);
						resolve();
					} catch (err) {
						reject(err);
					}
				})
				.req(req => {
					req.headers.authorization = 'Bearer foo';
				})
				.authenticate();
		});

		await new Promise((resolve, reject) => {
			passportHelper
				.fail(() => reject(new Error('Should not call fail()')))
				.error(err => reject(new Error(`Should not call error(): ${err.stack}`)))
				.success(user => {
					try {
						expect(user).to.eql(userInfo);
						resolve();
					} catch (err) {
						reject(err);
					}
				})
				.req(req => {
					req.headers.authorization = 'Bearer foo';
				})
				.authenticate();
		});
	});

	it('Should call fail() because of missing token', async () => {
		nock('https://crowd/usermanagement/1/session')
			.post(/.*/).reply(401);

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

	it('Should call error() because on a unexpected error', async () => {
		nock('https://crowd/usermanagement/1/session/foo')
			.post(/.*/).reply(500);

		const strategy = new Strategy({
			url: 'https://crowd', appName: 'foo', appPassword: 'bar'
		});

		return new Promise((resolve, reject) => {
			chai.passport.use(strategy)
				.success(() => reject(new Error('Should not call success()')))
				.fail(() => reject(new Error('Should not call fail()')))
				.error(resolve)
				.req(req => {
					req.headers.authorization = 'Bearer foo';
				})
				.authenticate();
		});
	});
});
