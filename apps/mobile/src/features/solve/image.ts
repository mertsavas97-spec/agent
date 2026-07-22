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
  };
}

/** Camera needs higher quality — worksheets crush at 0.55 and OCR fails while gallery screenshots still read. */
export const CAMERA_JPEG_QUALITY = 0.82;
/** Gallery screenshots / saved photos are already sharp; keep uploads smaller. */
export const LIBRARY_JPEG_QUALITY = 0.7;

export async function pickFromCamera(): Promise<PickedImage | null> {
  const ok = await ensureCameraPermission();
  if (!ok) return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: CAMERA_JPEG_QUALITY,
    // Full frame as-is — no forced crop UI
    allowsEditing: false,
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
