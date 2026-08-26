import {
  supabase,
} from '../../lib/supabase';


async function getUser() {
  const {
    data,
    error,
  } =
    await supabase.auth.getUser();


  if (error) {
    throw error;
  }


  if (!data?.user) {
    throw new Error(
      'Please sign in again.'
    );
  }


  return data.user;
}


export async function getWhatsAppTemplates() {
  const user =
    await getUser();


  const {
    data,
    error,
  } =
    await supabase
      .from(
        'whatsapp_templates'
      )
      .select('*')
      .eq(
        'user_id',
        user.id
      )
      .order(
        'created_at',
        {
          ascending: false,
        }
      );


  if (error) {
    throw error;
  }


  return data || [];
}


export async function createWhatsAppTemplate(
  values
) {
  const user =
    await getUser();


  const {
    data,
    error,
  } =
    await supabase
      .from(
        'whatsapp_templates'
      )
      .insert({
        user_id:
          user.id,

        name:
          values.name.trim(),

        category:
          values.category ||
          'utility',

        language:
          values.language ||
          'en',

        body:
          values.body.trim(),

        header_text:
          values.header_text?.trim() ||
          null,

        footer_text:
          values.footer_text?.trim() ||
          null,

        status:
          'draft',

        is_active: true,
      })
      .select()
      .single();


  if (error) {
    throw error;
  }


  return data;
}


export async function updateWhatsAppTemplate(
  id,
  values
) {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        'whatsapp_templates'
      )
      .update(values)
      .eq(
        'id',
        id
      )
      .select()
      .single();


  if (error) {
    throw error;
  }


  return data;
}


export async function toggleWhatsAppTemplate(
  template
) {
  return updateWhatsAppTemplate(
    template.id,
    {
      is_active:
        !template.is_active,
    }
  );
}


export async function deleteWhatsAppTemplate(
  id
) {
  const {
    error,
  } =
    await supabase
      .from(
        'whatsapp_templates'
      )
      .delete()
      .eq(
        'id',
        id
      );


  if (error) {
    throw error;
  }
}


export async function createDefaultWhatsAppTemplates() {
  const existing =
    await getWhatsAppTemplates();


  if (existing.length > 0) {
    return existing;
  }


  const defaults = [
    {
      name:
        'Welcome Message',

      category:
        'utility',

      language:
        'en',

      body:
        'Hello {{1}}, thank you for contacting YUVARAJ NETWORKS & SOLUTIONS. How can we help you today?',

      footer_text:
        'YUVARAJ NETWORKS & SOLUTIONS',
    },

    {
      name:
        'Lead Follow Up',

      category:
        'utility',

      language:
        'en',

      body:
        'Hello {{1}}, this is a follow-up regarding your enquiry with YUVARAJ NETWORKS & SOLUTIONS. Please let us know if you need any assistance.',

      footer_text:
        'YNS',
    },

    {
      name:
        'Meeting Reminder',

      category:
        'utility',

      language:
        'en',

      body:
        'Hello {{1}}, this is a reminder for our meeting scheduled on {{2}}. Looking forward to speaking with you.',

      footer_text:
        'YNS',
    },

    {
      name:
        'Thank You',

      category:
        'utility',

      language:
        'en',

      body:
        'Thank you {{1}} for choosing YUVARAJ NETWORKS & SOLUTIONS. We appreciate your business.',

      footer_text:
        'YNS',
    },
  ];


  for (
    const template of defaults
  ) {
    await createWhatsAppTemplate(
      template
    );
  }


  return getWhatsAppTemplates();
}
