import { IdToTitlePipe } from './id-to-title.pipe';

describe('IdToTitlePipe', () => {
  it('create an instance', () => {
    const pipe = new IdToTitlePipe();
    expect(pipe).toBeTruthy();
  });
  it('should parse properly', ()=> {
    const pipe = new IdToTitlePipe();
    expect(pipe.transform("data-table-component")).toEqual('Data Table Component')
  })
});
