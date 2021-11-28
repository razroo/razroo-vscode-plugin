import MockAdapter from 'axios-mock-adapter';
import { mockAxios, getVsCodeAuthenticationMock } from '../src/test/suite/utils/utils';
import { expect } from "chai";
import { getVSCodeAuthentication } from "../src/utils/request.utils";
import { URL_API_GATEWAY } from '../src/graphql/awsConstants';

const mock = new MockAdapter(mockAxios);
const vsCodeAuthenticationObject = getVsCodeAuthenticationMock();

describe('Request tests', () => {

    beforeEach(() => {
        mock.reset();
    });

	test('Check that the instance was saved in the backend', async() => {
        const url = URL_API_GATEWAY + `/authenticationVSCode/vsCodeInstanceId/${vsCodeAuthenticationObject.vsCodeInstanceId}`;
        mock.onGet(url).reply(200, vsCodeAuthenticationObject);
		await getVSCodeAuthentication({vsCodeInstanceId: vsCodeAuthenticationObject.vsCodeInstanceId}).then( (response) => {
			expect(response).equal(vsCodeAuthenticationObject);
			expect(mock.history.post.length).equal(1);
		});
	});

});