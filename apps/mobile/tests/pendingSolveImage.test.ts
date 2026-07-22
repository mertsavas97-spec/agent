import {
  CAMERA_JPEG_QUALITY,
  LIBRARY_JPEG_QUALITY,
} from '@/src/features/solve/image';
import {
  __resetPendingSolveImageForTests,
  peekPendingSolveImage,
  setPendingSolveImage,
  takePendingSolveImage,
} from '@/src/features/solve/pendingSolveImageStore';

describe('camera vs gallery image budgets', () => {
  it('keeps camera quality higher than library for OCR', () => {
    expect(CAMERA_JPEG_QUALITY).toBeGreaterThan(LIBRARY_JPEG_QUALITY);
    expect(CAMERA_JPEG_QUALITY).toBeGreaterThanOrEqual(0.8);
  });
});

describe('pendingSolveImageStore', () => {
  beforeEach(() => {
    __resetPendingSolveImageForTests();
  });

  it('preserves camera content:// URIs outside router params', () => {
    setPendingSolveImage({
      uri: 'content://media/external/images/media/42?extra=1',
      width: 100,
      height: 100,
      mimeType: 'image/jpeg',
      fileName: 'cam.jpg',
    });
    expect(peekPendingSolveImage()?.uri).toContain('content://');
    const claimed = takePendingSolveImage();
    expect(claimed?.uri).toContain('content://');
    expect(takePendingSolveImage()?.uri).toContain('content://');
  });
});
