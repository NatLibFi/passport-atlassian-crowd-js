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

import path from 'path';
import fs from 'fs';
import chai, {expect} from 'chai';
import chaiPassportStrategy from 'chai-passport-strategy';
import nock from 'nock';
import AtlassianCrowdStrategy from './index';

chai.use(chaiPassportStrategy);

const FIXTURES_PATH = path.join(__dirname, '..', 'test-fixtures');

describe('index', () => {
	afterEach(() => {
		nock.cleanAll();
	});

	it('Should call fail() because of missing credentials and token', async () => {
		nock('https://crowd/usermanagement/1/session')
			.post(/.*/).reply(401);

		const Strategy = new AtlassianCrowdStrategy({
			url: 'https://crowd', app: 'foo', password: 'bar'
		});

		return new Promise((resolve, reject) => {
			chai.passport.use(Strategy)
				.success(() => reject(new Error('Should not call success()')))
				.error(err => reject(new Error(`Should not call error(): ${err.stack}`)))
				.fail(resolve)
				.authenticate();
		});
	});

	it('Should succeed because of a valid token', () => {
		const validateSessionResponse = fs.readFileSync(path.join(FIXTURES_PATH, 'validateSessionResponse1.json'));
		const fetchUserResponse = fs.readFileSync(path.join(FIXTURES_PATH, 'fetchUserResponse1.json'));
		const userData = JSON.parse(fs.readFileSync(path.join(FIXTURES_PATH, 'userData1.json')));

		nock('https://crowd')
			.post('/usermanagement/1/session/bar').reply(200, validateSessionResponse)
			.get('/usermanagement/1/user?username=foobar').reply(200, fetchUserResponse);

		const Strategy = new AtlassianCrowdStrategy({
			url: 'https://crowd', app: 'foo', password: 'bar',
			ssoCookie: 'foo'
		});

		return new Promise((resolve, reject) => {
			chai.passport.use(Strategy)
				.fail(() => reject(new Error('Should not call fail()')))
				.error(err => reject(new Error(`Should not call error(): ${err.stack}`)))
				.success(user => {
					try {
						expect(user).to.eql(userData);
						resolve();
					} catch (err) {
						reject(err);
					}
				})
				.req(req => {
					req.headers.cookie = 'foo=bar';
				})
				.authenticate();
		});
	});

	it('Should succeed because of valid credentials', () => {
		const createSessionResponse = fs.readFileSync(path.join(FIXTURES_PATH, 'createSessionResponse2.json'));
		const fetchUserResponse = fs.readFileSync(path.join(FIXTURES_PATH, 'fetchUserResponse2.json'));
		const userData = JSON.parse(fs.readFileSync(path.join(FIXTURES_PATH, 'userData2.json')));

		nock('https://crowd')
			.post('/usermanagement/1/session').reply(201, createSessionResponse)
			.get('/usermanagement/1/user?username=foobar').reply(200, fetchUserResponse);

		const Strategy = new AtlassianCrowdStrategy({
			url: 'https://crowd', app: 'foo', password: 'bar',
			ssoCookie: 'foo'
		});

		return new Promise((resolve, reject) => {
			chai.passport.use(Strategy)
				.fail(() => reject(new Error('Should not call fail()')))
				.error(err => reject(new Error(`Should not call error(): ${err.stack}`)))
				.success(user => {
					try {
						expect(user).to.eql(userData);
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

	it('Should fetch group membership information', () => {
		const createSessionResponse = fs.readFileSync(path.join(FIXTURES_PATH, 'createSessionResponse3.json'));
		const fetchUserResponse = fs.readFileSync(path.join(FIXTURES_PATH, 'fetchUserResponse3.json'));
		const fetchDirectGroupResponse = fs.readFileSync(path.join(FIXTURES_PATH, 'fetchDirectGroupResponse3.json'));
		const fetchNestedGroupResponse = fs.readFileSync(path.join(FIXTURES_PATH, 'fetchNestedGroupResponse3.json'));
		const userData = JSON.parse(fs.readFileSync(path.join(FIXTURES_PATH, 'userData3.json')));

		nock('https://crowd')
			.post('/usermanagement/1/session').reply(201, createSessionResponse)
			.get('/usermanagement/1/user?username=foobar').reply(200, fetchUserResponse)
			.get('/usermanagement/1/user/group/direct?username=foobar').reply(200, fetchDirectGroupResponse)
			.get('/usermanagement/1/user/group/nested?username=foobar').reply(200, fetchNestedGroupResponse);

		const Strategy = new AtlassianCrowdStrategy({
			url: 'https://crowd', app: 'foo', password: 'bar',
			ssoCookie: 'foo', fetchGroupMembership: true
		});

		return new Promise((resolve, reject) => {
			chai.passport.use(Strategy)
				.fail(() => reject(new Error('Should not call fail()')))
				.error(err => reject(new Error(`Should not call error(): ${err.stack}`)))
				.success(user => {
					try {
						expect(user).to.eql(userData);
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
});
