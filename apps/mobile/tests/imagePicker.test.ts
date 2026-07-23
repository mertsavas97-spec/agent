import * as ImagePicker from 'expo-image-picker';

import { pickFromCamera, pickFromLibrary } from '@/src/features/solve/image';

jest.mock('@/src/lib/hasExpoNativeModule', () => ({
  hasExpoNativeModule: jest.fn(() => true),
}));

jest.mock('expo-image-picker', () => ({
  getCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  requestCameraPermissionsAsync: jest.fn(),
  getMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  UIImagePickerPreferredAssetRepresentationMode: {
    Compatible: 'compatible',
    Current: 'current',
    Automatic: 'automatic',
  },
}));

describe('image picker crop policy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not force crop after camera capture', async () => {
    (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://a.jpg', width: 100, height: 200 }],
    });
    await pickFromCamera();
    expect(ImagePicker.launchCameraAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        allowsEditing: false,
        quality: expect.any(Number),
        base64: true,
      }),
    );
    const camOpts = (ImagePicker.launchCameraAsync as jest.Mock).mock.calls[0][0];
    const libMock = ImagePicker.launchImageLibraryAsync as jest.Mock;
    void libMock;
    expect(camOpts.quality).toBeGreaterThanOrEqual(0.8);
  });

  it('does not force crop after gallery pick', async () => {
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://b.jpg', width: 100, height: 200 }],
    });
    await pickFromLibrary();
    expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(
      expect.objectContaining({ allowsEditing: false }),
    );
    const libOpts = (ImagePicker.launchImageLibraryAsync as jest.Mock).mock.calls[0][0];
    expect(libOpts.quality).toBeLessThan(0.8);
  });
});
