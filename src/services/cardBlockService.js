import { supabase } from '../../lib/supabase';

export const BLOCK_LIBRARY = [
  {
    type: 'phone',
    label: 'Phone',
    icon: 'call-outline',
    category: 'Contact',
    placeholder: '+91 9876543210',
  },
  {
    type: 'email',
    label: 'Email',
    icon: 'mail-outline',
    category: 'Contact',
    placeholder: 'hello@example.com',
  },
  {
    type: 'whatsapp',
    label: 'WhatsApp',
    icon: 'logo-whatsapp',
    category: 'Contact',
    placeholder: '+91 9876543210',
  },
  {
    type: 'map',
    label: 'Map / Location',
    icon: 'location-outline',
    category: 'Contact',
    placeholder: 'Location or Google Maps link',
  },

  {
    type: 'instagram',
    label: 'Instagram',
    icon: 'logo-instagram',
    category: 'Social',
    placeholder: 'https://instagram.com/...',
  },
  {
    type: 'facebook',
    label: 'Facebook',
    icon: 'logo-facebook',
    category: 'Social',
    placeholder: 'https://facebook.com/...',
  },
  {
    type: 'linkedin',
    label: 'LinkedIn',
    icon: 'logo-linkedin',
    category: 'Social',
    placeholder: 'https://linkedin.com/in/...',
  },
  {
    type: 'youtube',
    label: 'YouTube',
    icon: 'logo-youtube',
    category: 'Social',
    placeholder: 'https://youtube.com/...',
  },
  {
    type: 'google_reviews',
    label: 'Google Reviews',
    icon: 'star-outline',
    category: 'Social',
    placeholder: 'Google review link',
  },

  {
    type: 'website',
    label: 'Website',
    icon: 'globe-outline',
    category: 'Content',
    placeholder: 'https://example.com',
  },
  {
    type: 'pdf',
    label: 'PDF',
    icon: 'document-text-outline',
    category: 'Content',
    placeholder: 'PDF URL',
  },
  {
    type: 'video',
    label: 'Video',
    icon: 'videocam-outline',
    category: 'Content',
    placeholder: 'Video URL',
  },
  {
    type: 'drive',
    label: 'Google Drive',
    icon: 'folder-outline',
    category: 'Content',
    placeholder: 'Google Drive URL',
  },
  {
    type: 'image',
    label: 'Image',
    icon: 'image-outline',
    category: 'Content',
    placeholder: 'Image URL',
  },

  {
    type: 'custom',
    label: 'Custom Link',
    icon: 'link-outline',
    category: 'Other',
    placeholder: 'https://...',
  },
];

export function getBlockDefinition(type) {
  return (
    BLOCK_LIBRARY.find(
      (item) => item.type === type
    ) || {
      type,
      label: 'Custom',
      icon: 'link-outline',
      category: 'Other',
      placeholder: 'Enter value',
    }
  );
}

export async function getCardBlocks(cardId) {
  const { data, error } = await supabase
    .from('card_blocks')
    .select('*')
    .eq('card_id', cardId)
    .order('sort_order', {
      ascending: true,
    })
    .order('created_at', {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function createCardBlock(
  cardId,
  values
) {
  const existing = await getCardBlocks(cardId);

  const definition =
    getBlockDefinition(values.block_type);

  const { data, error } = await supabase
    .from('card_blocks')
    .insert({
      card_id: cardId,

      block_type:
        values.block_type,

      title:
        values.title ||
        definition.label,

      subtitle:
        values.subtitle || null,

      value:
        values.value || null,

      url:
        values.url || null,

      image_url:
        values.image_url || null,

      icon_name:
        values.icon_name ||
        definition.icon,

      sort_order:
        values.sort_order ??
        existing.length + 1,

      is_active:
        values.is_active !== false,

      metadata:
        values.metadata || {},
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateCardBlock(
  blockId,
  values
) {
  const { data, error } = await supabase
    .from('card_blocks')
    .update({
      ...values,
      updated_at:
        new Date().toISOString(),
    })
    .eq('id', blockId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteCardBlock(
  blockId
) {
  const { error } = await supabase
    .from('card_blocks')
    .delete()
    .eq('id', blockId);

  if (error) {
    throw error;
  }
}

export async function reorderCardBlocks(
  blocks
) {
  await Promise.all(
    blocks.map((block, index) =>
      updateCardBlock(block.id, {
        sort_order: index + 1,
      })
    )
  );

  return blocks.map(
    (block, index) => ({
      ...block,
      sort_order: index + 1,
    })
  );
}
