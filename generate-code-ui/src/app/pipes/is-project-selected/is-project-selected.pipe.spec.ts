import { IsProjectSelectedPipe } from './is-project-selected.pipe';

describe('IsProjectSelected', () => {
  it('create an instance', () => {
    const pipe = new IsProjectSelectedPipe();
    expect(pipe).toBeTruthy();
  });
});
