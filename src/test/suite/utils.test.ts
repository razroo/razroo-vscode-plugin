import * as vscode from 'vscode';
import { updatePrivateDirectoriesInVSCodeAuthentication } from '../../utils/utils.js';
import { beforeEach } from 'mocha';
import { expect} from 'chai';
import MockAdapter from 'axios-mock-adapter';
import { mockAxios, getMockIdToken, getVsCodeAuthenticationMock } from './utils/utils.js';
import { URL_GRAPHQL } from '../../graphql/awsConstants';

const mock = new MockAdapter(mockAxios);
const idToken = getMockIdToken();
const vsCodeAuthenticationObject = getVsCodeAuthenticationMock();

suite('Utils tests', () => {
	
	beforeEach(() => {
		mock.reset();
	});

	vscode.window.showInformationMessage('Start all tests.');

	test('Should update private directories in vs code authentication table', () => {
		mock.onPost(URL_GRAPHQL).reply(200, vsCodeAuthenticationObject);
		updatePrivateDirectoriesInVSCodeAuthentication('instance_to_testing', idToken, true, '1234').then( (response) => {
			expect(response).equal(vsCodeAuthenticationObject);
			expect(mock.history.post.length).equal(1);
		});
	});
});

