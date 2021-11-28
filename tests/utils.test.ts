import { getMockIdToken, mockAxios, getVsCodeAuthenticationMock } from './test-utils';
import { URL_GRAPHQL } from './../src/graphql/awsConstants';
import { getAuth0Url, updatePrivateDirectoriesInVSCodeAuthentication, isExpiredToken } from './../src/utils/utils';
import { v4 as uuidv4 } from 'uuid';
import * as jwt from 'jsonwebtoken';
import {assert, expect} from 'chai';
import MockAdapter from 'axios-mock-adapter';

const mock = new MockAdapter(mockAxios);
const idToken = getMockIdToken();
const vsCodeAuthenticationObject = getVsCodeAuthenticationMock();

describe('Utils tests', () => {
	
	beforeEach(() => {
		mock.reset();
	});

	test('Generate URL with JWT data to authenticate in the backend', () => {
		const vsCodeInstanceId = uuidv4();
		const loginUrl = getAuth0Url(vsCodeInstanceId, false);
		const headToRemoved = loginUrl.search('=') + 1;
		const jwtData = loginUrl.slice(headToRemoved, loginUrl.length);
		const vsCodeInstaceIdExpected: any = jwt.verify(jwtData, 'razroo-vsCodeExtension');
		assert.strictEqual(vsCodeInstanceId, vsCodeInstaceIdExpected?.vsCodeToken);
	});

	test('Should update private directories in vs code authentication table', () => {
		mock.onPost(URL_GRAPHQL).reply(200, vsCodeAuthenticationObject);
		updatePrivateDirectoriesInVSCodeAuthentication('instance_to_testing', idToken, true, '1234').then( (response) => {
			expect(response).equal(vsCodeAuthenticationObject);
			expect(mock.history.post.length).equal(1);
		});
	});

	test('IdToken should not equal isExpiredToken', () => {
		assert.isNotTrue(isExpiredToken(idToken));
	});

});

