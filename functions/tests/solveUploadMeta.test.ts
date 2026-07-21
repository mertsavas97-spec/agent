import { isSolveTaggedUpload, metaValue } from '../src/solve/solveUploadMeta';

describe('solveUploadMeta', () => {
  it('reads camelCase and lowercased GCS keys', () => {
    expect(metaValue({ cozbilSolve: '1' }, 'cozbilSolve')).toBe('1');
    expect(metaValue({ cozbilsolve: '1' }, 'cozbilSolve')).toBe('1');
    expect(metaValue({ examType: 'lgs' }, 'examType')).toBe('lgs');
    expect(metaValue({ examtype: 'ygs' }, 'examType')).toBe('ygs');
  });

  it('detects solve tags case-insensitively', () => {
    expect(isSolveTaggedUpload({ cozbilSolve: '1' })).toBe(true);
    expect(isSolveTaggedUpload({ cozbilsolve: 'true' })).toBe(true);
    expect(isSolveTaggedUpload({ cozbilSolve: '0' })).toBe(false);
    expect(isSolveTaggedUpload({})).toBe(false);
    expect(isSolveTaggedUpload(undefined)).toBe(false);
  });
});
