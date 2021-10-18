import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';
import * as jwt from 'jsonwebtoken';
import { getAuth0Url, isExpiredToken, updatePrivateDirectoriesInVSCodeAuthentication } from '../../utils/utils';
import { beforeEach } from 'mocha';
import {assert, expect} from 'chai';
import MockAdapter from 'axios-mock-adapter';
import { mockAxios, getMockIdToken, getVsCodeAuthenticationMock } from './utils/utils';
import { URL_GRAPHQL } from '../../graphql/awsConstants';

const mock = new MockAdapter(mockAxios);
const idToken = getMockIdToken();
const vsCodeAuthenticationObject = getVsCodeAuthenticationMock();

suite('Utils tests', () => {
	
	beforeEach(() => {
		mock.reset();
	});

	vscode.window.showInformationMessage('Start all tests.');
	test('Generate URL with JWT data to authenticate in the backend', () => {
		const vsCodeInstanceId = uuidv4();
		const loginUrl = getAuth0Url(vsCodeInstanceId);
		const headToRemoved = loginUrl.search('=') + 1;
		const jwtData = loginUrl.slice(headToRemoved, loginUrl.length);
		const vsCodeInstaceIdExpected: any = jwt.verify(jwtData, 'razroo-vsCodeExtension');
		assert.strictEqual(vsCodeInstanceId, vsCodeInstaceIdExpected?.vsCodeToken);
	});

	test('Should update private directories in vs code authentication table', () => {
		mock.onPost(URL_GRAPHQL).reply(200, vsCodeAuthenticationObject);
		updatePrivateDirectoriesInVSCodeAuthentication('instance_to_testing', idToken).then( (response) => {
			expect(response).equal(vsCodeAuthenticationObject);
			expect(mock.history.post.length).equal(1);
		});
	});

	test('IdToken should not equal isExpiredToken', () => {
		assert.isNotTrue(isExpiredToken(idToken));
	});

});

