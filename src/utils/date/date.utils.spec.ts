import { isTokenExpired } from "./date.utils";

describe('data', () => {
  it('should return false as the token is expired', () => {
    const dummyToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const result = isTokenExpired(dummyToken);
    const expected = false;
    expect(result).toEqual(expected);
  });  
});