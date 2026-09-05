import { supabase } from '../../lib/supabase';
import { PROFILE_BUCKET } from '../constants/config';

export async function uploadProfileImage(userId, cardId, asset) {
  const response = await fetch(asset.uri);
  const arrayBuffer = await response.arrayBuffer();

  const extension = asset.fileName?.split('.').pop()?.toLowerCase() || 'jpg';

  const contentType = asset.mimeType || (extension === 'png' ? 'image/png' : 'image/jpeg');

  const filePath = `${userId}/${cardId}.${extension}`;

  const { error } = await supabase.storage.from(PROFILE_BUCKET).upload(filePath, arrayBuffer, {
    contentType,
    upsert: true,
  });

  if (error) {
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(PROFILE_BUCKET).getPublicUrl(filePath);

  return `${publicUrl}?v=${Date.now()}`;
}

export async function removeProfileImages(userId, cardId) {
  const extensions = ['jpg', 'jpeg', 'png', 'webp'];

  const paths = extensions.map((extension) => `${userId}/${cardId}.${extension}`);

  const { error } = await supabase.storage.from(PROFILE_BUCKET).remove(paths);

  if (error) {
    throw error;
  }
}
