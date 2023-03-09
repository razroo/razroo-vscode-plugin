import { RAZROO_DEV_URL, RAZROO_URL } from './../../constants';
import { getAuth0Url } from './authentication';
describe('getAuth0Url',  () => {
    it('should return prod url if it is production', () => {
      const isProduction = true;
      const result = getAuth0Url(isProduction);
      const expected = `${RAZROO_URL}/api/auth/login`;

      expect(result).toEqual(expected);
    });

    it('should return dev url if it is dev', () => {
        const isProduction = false;
        const result = getAuth0Url(isProduction);
        const expected = `${RAZROO_DEV_URL}/api/auth/login`;
  
        expect(result).toEqual(expected);
      });
});