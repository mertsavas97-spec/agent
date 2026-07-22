/**
 * Camera / gallery helpers via expo-image-picker.
 * Official Expo docs: https://docs.expo.dev/versions/latest/sdk/imagepicker/
 */
import * as ImagePicker from 'expo-image-picker';

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

async function ensureCameraPermission(): Promise<boolean> {
  const current = await ImagePicker.getCameraPermissionsAsync();
  if (current.granted) return true;
  const requested = await ImagePicker.requestCameraPermissionsAsync();
  return requested.granted;
}

async function ensureLibraryPermission(): Promise<boolean> {
  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (current.granted) return true;
  const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return requested.granted;
}

function mapAsset(asset: ImagePicker.ImagePickerAsset): PickedImage {
  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    mimeType: asset.mimeType,
    fileName: asset.fileName ?? undefined,
    base64: typeof asset.base64 === 'string' && asset.base64.length > 0
      ? asset.base64
      : undefined,
  };
}

/** Camera needs higher quality — worksheets/screens crush at low quality and OCR fails. */
export const CAMERA_JPEG_QUALITY = 0.92;
/** Gallery screenshots / saved photos are already sharp; keep uploads smaller. */
export const LIBRARY_JPEG_QUALITY = 0.78;

export async function pickFromCamera(): Promise<PickedImage | null> {
  const ok = await ensureCameraPermission();
  if (!ok) return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: CAMERA_JPEG_QUALITY,
    // Full frame as-is — no forced crop UI
    allowsEditing: false,
    // Inline bytes — camera URIs often cannot be re-fetched for OCR upload.
    base64: true,
    // iOS HEIC → JPEG so dogfood OCR (sharp/tesseract) can decode the bytes.
    preferredAssetRepresentationMode:
      ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
  });
  if (result.canceled || !result.assets[0]) return null;
  return mapAsset(result.assets[0]);
}

export async function pickFromLibrary(): Promise<PickedImage | null> {
  const ok = await ensureLibraryPermission();
  if (!ok) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: LIBRARY_JPEG_QUALITY,
    // Full photo as-is — no forced crop UI
    allowsEditing: false,
    // Gallery file:// usually re-fetches; base64 is a safe fallback on Android.
    base64: true,
    preferredAssetRepresentationMode:
      ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
  });
  if (result.canceled || !result.assets[0]) return null;
  return mapAsset(result.assets[0]);
}

/**
 * Multi-select gallery for batch solve. No crop (Expo multi + product choice).
 * Caps at `selectionLimit` (product: MULTI_BATCH_MAX).
 */
export async function pickMultipleFromLibrary(
  selectionLimit: number,
): Promise<PickedImage[] | null> {
  const ok = await ensureLibraryPermission();
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
