import {
  __resetMultiBatchStoreForTests,
  clearPendingMultiBatch,
  peekPendingMultiBatch,
  releaseClaimedMultiBatch,
  setPendingMultiBatch,
  takePendingMultiBatch,
} from '@/src/features/solve/multiBatchStore';

describe('multiBatchStore', () => {
  beforeEach(() => {
    __resetMultiBatchStoreForTests();
  });

  it('re-returns claimed batch on Strict Mode remount take()', () => {
    setPendingMultiBatch({
      images: [
        {
          uri: 'file://a.jpg',
          width: 100,
          height: 100,
          mimeType: 'image/jpeg',
          fileName: 'a.jpg',
        },
        {
          uri: 'file://b.jpg',
          width: 100,
          height: 100,
          mimeType: 'image/jpeg',
          fileName: 'b.jpg',
        },
      ],
      examType: 'kpss',
    });

    const first = takePendingMultiBatch();
    expect(first?.images).toHaveLength(2);
    const second = takePendingMultiBatch();
    expect(second).toBe(first);
    expect(peekPendingMultiBatch()).toBe(first);

    releaseClaimedMultiBatch();
    expect(takePendingMultiBatch()).toBeNull();
  });

  it('clearPendingMultiBatch wipes pending and claimed', () => {
    setPendingMultiBatch({
      images: [
        {
          uri: 'file://a.jpg',
          width: 1,
          height: 1,
          mimeType: 'image/jpeg',
          fileName: 'a.jpg',
        },
      ],
    });
    takePendingMultiBatch();
    clearPendingMultiBatch();
    expect(peekPendingMultiBatch()).toBeNull();
    expect(takePendingMultiBatch()).toBeNull();
  });
});
