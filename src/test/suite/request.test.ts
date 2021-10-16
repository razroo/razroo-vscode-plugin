import MockAdapter from 'axios-mock-adapter';
import { mockAxios, getVsCodeAuthenticationMock } from './utils/utils';
import { expect } from "chai";
import { getVSCodeAuthentication } from "../../utils/request.utils";
import { URL_API_GATEGAY } from '../../graphql/awsConstants';
import { beforeEach } from 'mocha';

const mock = new MockAdapter(mockAxios);
const vsCodeAuthenticationObject = getVsCodeAuthenticationMock();

suite('Request tests', () => {

    beforeEach(() => {
        mock.reset();
    });

	test('Check that the instance was saved in the backend', () => {
        const url =
    URL_API_GATEGAY +
    `/authenticationVSCode/vsCodeInstanceId/${vsCodeAuthenticationObject.vsCodeInstanceId}`;
    mock.onGet(url).reply(200, vsCodeAuthenticationObject);
		getVSCodeAuthentication({vsCodeInstanceId: vsCodeAuthenticationObject.vsCodeInstanceId}).then( (response) => {
			expect(response).equal(vsCodeAuthenticationObject);
			expect(mock.history.post.length).equal(1);
		});
	});

});