import { ConnectTextPipe } from './connect-text.pipe';

describe('ConnectTextPipe', () => {
  it('create an instance', () => {
    const pipe = new ConnectTextPipe();
    expect(pipe).toBeTruthy();
  });

  it('should display connect if selecte projects not within original projects', () => {
    const selectedProjects = [
      {
        id: '123'
      }
    ] as any;
    const originalProjects = [
      {
        id: 'test123'
      }
    ] as any;
    const pipe = new ConnectTextPipe();
    const result = pipe.transform(selectedProjects, originalProjects);
    expect(result).toEqual('Connect');
  });
});