import { containsInfrastructureCommandPath } from "./command";

describe('containsInfrastructureCommandPath', () => {
  it('should return true if string contains <%= infrastructureCommandPath %> ', () => {
    const mockParameters = {
      test: 'hello',
      infrastructureCommandPath: 'libs'  
    };
    const result = containsInfrastructureCommandPath(mockParameters);
    const expected = true;
    expect(!!result).toEqual(expected);
  });  

  it('should return false if string does not contain <%= infrastructureCommandPath %> ', () => {
    const mockParameters = {
      test: 'hello',  
    };
    const result = containsInfrastructureCommandPath(mockParameters);
    const expected = false;
    expect(!!result).toEqual(expected);
  });  
});