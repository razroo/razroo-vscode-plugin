import { containsInfrastructureCommandPath } from "./command";

describe('containsInfrastructureCommandPath', () => {
  it('should return true if string contains <%= infrastructureCommandPath %> ', () => {
    const mockString = 'test this <%= infrastructureCommandPath %> and test more';
    const result = containsInfrastructureCommandPath(mockString);
    const expected = true;
    expect(result).toEqual(expected);
  });  

  it('should return false if string does not contain <%= infrastructureCommandPath %> ', () => {
    const mockString = 'test this <%= infrastructmmandPath %> and test more';
    const result = containsInfrastructureCommandPath(mockString);
    const expected = false;
    expect(result).toEqual(expected);
  });  
});