import { EMPTY, MEMENTO_RAZROO_ID_VS_CODE_TOKEN } from './../../constants';
import { getOrCreateAndUpdateIdToken } from "./token";
import { validate as uuidValidate } from 'uuid';
const vscode = require('vscode');

jest.mock('vscode');
jest.mock('parse-git-config',()=>({
  parseGitConfig: jest.fn().mockResolvedValue({'remote "origin"': { url : "https://github.com/myusername/repo.git"}})
}));
describe('getOrCreateAndUpdateIdToken', () => {
  const context = {
    workspaceState: {
      get: jest.fn(),
      update: jest.fn()
    }
  };
  const userId = 'myUserId';
  const projectName = 'myProjectName';
  const gitConfig = {
    'remote "origin"': {
      url: "https://github.com/myusername/${projectName}.git"
    }
  };
  const workspaceFolders = [{uri: {fspath: 'path/to/workspace'}}];

  beforeEach(()=>{
    context.workspaceState.get.mockReset();
    context.workspaceState.update.mockReset();
    vscode.workspace.workspaceFolders = workspaceFolders;
  });

  afterEach(()=>{
    jest.clearAllMocks();
  })
  //it('should return the token verbatim if it exists', () => {
    //const mockContext = {
      //workspaceState: {
        //get: (test: any) => test
      //}
    //};
    //const mockUserId = 'abc123';
    //const result = getOrCreateAndUpdateIdToken(mockContext as any, mockUserId);
    //const expected = MEMENTO_RAZROO_ID_VS_CODE_TOKEN;

    //expect(result).toEqual(expected);
  //});

  //it('should return the new token if existing one is not there', () => {
    //const mockContext = {
      //workspaceState: {
        //get: (test: any) => undefined,
        //update: (test: any, newToken) => {}
      //}
    //};
    //const mockUserId = 'abc123';
    //const spy = jest.spyOn(mockContext.workspaceState, 'update');
    //getOrCreateAndUpdateIdToken(mockContext as any, mockUserId);
    //const token = MEMENTO_RAZROO_ID_VS_CODE_TOKEN;

    //expect(spy).toHaveBeenCalledWith(token, expect.anything());
  //});

  it('should return existing token if it already exists', async ()=>{
    context.workspaceState.get.mockReturnValue('token-value');
    const token = await getOrCreateAndUpdateIdToken(context as any,userId);
    expect(token).toBe('token-value');
    expect(context.workspaceState.update).not.toHaveBeenCalled();
  });

  it('should return empty token if workspace is empty', async ()=>{
    context.workspaceState.get.mockReturnValue(undefined);
    vscode.workspace.workspaceFolders = undefined;
    const token = await getOrCreateAndUpdateIdToken(context as any,userId);
    expect(token).toBe(EMPTY);
    expect(context.workspaceState.update).toHaveBeenCalledWith(MEMENTO_RAZROO_ID_VS_CODE_TOKEN, EMPTY);
  });

  // it('should return no-git-found', async ()=>{
  //   const context = {
  //     workspaceState: {
  //       get: jest.fn(),
  //       update: jest.fn()
  //     }
  //   };
  //   const parseGitConfig = { sync: jest.fn().mockReturnValue(undefined) };
  //   jest.mock('parse-git-config', ()=> parseGitConfig);
  //   const token = await getOrCreateAndUpdateIdToken(context as any,userId);
  //   expect(token).toBe(EMPTY);
  //   expect(context.workspaceState.update).toHaveBeenCalledWith(MEMENTO_RAZROO_ID_VS_CODE_TOKEN, EMPTY);
  // });
});