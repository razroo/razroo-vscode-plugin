import { getFileS3 } from './../src/utils/request.utils';
import { URL_GRAPHQL } from './../src/graphql/awsConstants';
import { updatePrivateDirectoriesRequest } from './../src/utils/graphql.utils';
import { mockAxios, getMockIdToken, getVsCodeAuthenticationMock } from './test-utils';
import MockAdapter from 'axios-mock-adapter';

const mock = new MockAdapter(mockAxios);
const vsCodeAuthenticationObject = getVsCodeAuthenticationMock();
const idToken = getMockIdToken();

describe('Graphql tests', () => {

	beforeEach(() => {
        mock.reset();
	});

	it('Should update the privateDirectories attribute of the vscode authentication table with execute_test_privateDirectories', async() => {
		const privateDirectories = "execute_test_privateDirectories";
        mock.onPost(URL_GRAPHQL).reply(200, vsCodeAuthenticationObject);
		await updatePrivateDirectoriesRequest({
			vsCodeToken: vsCodeAuthenticationObject.vsCodeInstanceId,
			idToken, 
			privateDirectories
		}).then(response => {
            expect(response).toEqual(vsCodeAuthenticationObject);
			expect(mock.history.post.length).toEqual(1);
        });
	});
	
	test('Should obtain zip file from S3', () => {
        const data = {
            data: ['1f210', 'c49ae', '892fe']
        };
        mock.onPost(URL_GRAPHQL).reply(200, data);
        getFileS3({url: 'urlTest'}).then(response => {
            expect(Object.keys(response).length).toBeGreaterThan(0);
            expect(mock.history.post.length).toEqual(1);
        });
	});
});