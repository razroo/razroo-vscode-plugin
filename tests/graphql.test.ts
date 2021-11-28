import { updatePrivateDirectoriesRequest } from "../../utils/graphql.utils";
import MockAdapter from 'axios-mock-adapter';
import { URL_GRAPHQL } from '../../graphql/awsConstants';
import { mockAxios, getMockIdToken, getVsCodeAuthenticationMock } from "./utils/utils";
import { expect } from "chai";
import { beforeEach } from "mocha";
import { getFileS3 } from "../../utils/request.utils";

const mock = new MockAdapter(mockAxios);
const vsCodeAuthenticationObject = getVsCodeAuthenticationMock();
const idToken = getMockIdToken();

suite('Graphql tests', () => {

	beforeEach(() => {
        mock.reset();
	});

	test('Should update the privateDirectories attribute of the vscode authentication table with execute_test_privateDirectories', () => {
		const privateDirectories = "execute_test_privateDirectories";
        mock.onPost(URL_GRAPHQL).reply(200, vsCodeAuthenticationObject);
		updatePrivateDirectoriesRequest({
			vsCodeToken: vsCodeAuthenticationObject.vsCodeInstanceId,
			idToken, 
			privateDirectories
		}).then(response => {
            expect(response).equal(vsCodeAuthenticationObject);
			expect(mock.history.post.length).equal(1);
        });
	});
	
	test('Should obtain zip file from S3', () => {
        const data = {
            data: ['1f210', 'c49ae', '892fe']
        };
        mock.onPost(URL_GRAPHQL).reply(200, data);
        getFileS3({url: 'urlTest'}).then(response => {
            expect(Object.keys(response)).to.have.lengthOf.greaterThan(0);
            expect(mock.history.post.length).equal(1);
        });
	});
});