import { parseSolveUploadPath } from '../src/solve/parseUploadPath';

describe('parseSolveUploadPath', () => {
  it('parses jpeg upload paths', () => {
    expect(parseSolveUploadPath('users/abc/uploads/171000.jpg')).toEqual({
      uid: 'abc',
      localId: '171000',
      imagePath: 'users/abc/uploads/171000.jpg',
    });
  });

  it('rejects non-upload paths', () => {
    expect(parseSolveUploadPath('users/abc/profile.jpg')).toBeNull();
    expect(parseSolveUploadPath('users/abc/uploads/note.txt')).toBeNull();
    expect(parseSolveUploadPath(undefined)).toBeNull();
  });
});
