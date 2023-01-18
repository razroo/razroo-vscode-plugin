import { MEMENTO_RAZROO_ID_VS_CODE_TOKEN } from './../../constants';
import { getOrCreateAndUpdateIdToken } from "./token";
import { validate as uuidValidate } from 'uuid';


describe('getOrCreateAndUpdateIdToken', () => {
  it('should return the token verbatim if it exists', () => {
    const mockContext = {
      workspaceState: {
        get: (test: any) => test
      }
    };
    const mockUserId = 'abc123';
    const result = getOrCreateAndUpdateIdToken(mockContext as any, mockUserId);
    const expected = MEMENTO_RAZROO_ID_VS_CODE_TOKEN;

    expect(result).toEqual(expected);
  });

  it('should return the new token if existing one is not there', () => {
    const mockContext = {
      workspaceState: {
        get: (test: any) => undefined,
        update: (test: any, newToken) => {}
      }
    };
    const mockUserId = 'abc123';
    const spy = jest.spyOn(mockContext.workspaceState, 'update');
    getOrCreateAndUpdateIdToken(mockContext as any, mockUserId);
    const token = MEMENTO_RAZROO_ID_VS_CODE_TOKEN;

    expect(spy).toHaveBeenCalledWith(token, expect.anything());
  });
});