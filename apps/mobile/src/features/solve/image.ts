/**
 * Camera / gallery helpers via expo-image-picker.
 * Official Expo docs: https://docs.expo.dev/versions/latest/sdk/imagepicker/
 *
 * Dynamic require: old native builds without ImagePicker native module must not
 * crash when Metro serves newer JS.
 */

export { buildUploadPath } from './paths';

export type PickedImage = {
  uri: string;
  width: number;
  height: number;
  mimeType: string | undefined;
  fileName: string | undefined;
  /**
   * Raw base64 (no data: prefix). Camera captures should always set this —
   * `content://` / `ph://` URI fetch is flaky and OCR then fails on clear photos.
   */
  base64?: string;
};

type ImagePickerAsset = {
  uri: string;
  width: number;
  height: number;
  mimeType?: string | null;
  fileName?: string | null;
  base64?: string | null;
};

type ImagePickerResult = {
  canceled: boolean;
  assets?: ImagePickerAsset[] | null;
};

type ImagePickerModule = {
  getCameraPermissionsAsync: () => Promise<{ granted: boolean }>;
  requestCameraPermissionsAsync: () => Promise<{ granted: boolean }>;
  getMediaLibraryPermissionsAsync: () => Promise<{ granted: boolean }>;
  requestMediaLibraryPermissionsAsync: () => Promise<{ granted: boolean }>;
  launchCameraAsync: (opts: unknown) => Promise<ImagePickerResult>;
  launchImageLibraryAsync: (opts: unknown) => Promise<ImagePickerResult>;
  UIImagePickerPreferredAssetRepresentationMode: { Compatible: unknown };
};

function loadImagePicker(): ImagePickerModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-image-picker') as ImagePickerModule;
  } catch {
    return null;
  }
}

async function ensureCameraPermission(ImagePicker: ImagePickerModule): Promise<boolean> {
  const current = await ImagePicker.getCameraPermissionsAsync();
  if (current.granted) return true;
  const requested = await ImagePicker.requestCameraPermissionsAsync();
  return requested.granted;
}

async function ensureLibraryPermission(ImagePicker: ImagePickerModule): Promise<boolean> {
  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (current.granted) return true;
  const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return requested.granted;
}

function mapAsset(asset: ImagePickerAsset): PickedImage {
  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    mimeType: asset.mimeType ?? undefined,
    fileName: asset.fileName ?? undefined,
    base64:
      typeof asset.base64 === 'string' && asset.base64.length > 0
        ? asset.base64
        : undefined,
  };
}

/** Camera needs higher quality — worksheets/screens crush at low quality and OCR fails. */
export const CAMERA_JPEG_QUALITY = 0.92;
/** Gallery screenshots / saved photos are already sharp; keep uploads smaller. */
export const LIBRARY_JPEG_QUALITY = 0.78;

export async function pickFromCamera(): Promise<PickedImage | null> {
  const ImagePicker = loadImagePicker();
  if (!ImagePicker) return null;
  const ok = await ensureCameraPermission(ImagePicker);
  if (!ok) return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: CAMERA_JPEG_QUALITY,
    allowsEditing: false,
    base64: true,
    preferredAssetRepresentationMode:
      ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  return mapAsset(result.assets[0]);
}

export async function pickFromLibrary(): Promise<PickedImage | null> {
  const ImagePicker = loadImagePicker();
  if (!ImagePicker) return null;
  const ok = await ensureLibraryPermission(ImagePicker);
  if (!ok) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: LIBRARY_JPEG_QUALITY,
    allowsEditing: false,
    base64: true,
    preferredAssetRepresentationMode:
      ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  return mapAsset(result.assets[0]);
}

/**
 * Multi-select gallery for batch solve. No crop (Expo multi + product choice).
 * Caps at `selectionLimit` (product: MULTI_BATCH_MAX).
 */
export async function pickMultipleFromLibrary(
  selectionLimit: number,
): Promise<PickedImage[] | null> {
  const ImagePicker = loadImagePicker();
  if (!ImagePicker) return null;
  const ok = await ensureLibraryPermission(ImagePicker);
  if (!ok) return null;

  const limit = Math.max(1, Math.min(selectionLimit, 10));
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: LIBRARY_JPEG_QUALITY,
    allowsEditing: false,
    allowsMultipleSelection: true,
    selectionLimit: limit,
    preferredAssetRepresentationMode:
      ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
  });
  if (result.canceled || !result.assets?.length) return null;
  return result.assets.slice(0, limit).map(mapAsset);
}
