import { supabase } from '../../lib/supabase';

const API_BASE_URL = 'https://yns-card-web.vercel.app';

async function getAuthHeaders() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  const session = data?.session;

  if (!session?.access_token) {
    throw new Error('Please sign in again.');
  }

  return {
    'Content-Type': 'application/json',

    Authorization: `Bearer ${session.access_token}`,
  };
}

async function apiRequest(path, options = {}) {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,

    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error('Invalid response from YNS server.');
  }

  if (!response.ok || result?.ok === false) {
    throw new Error(result?.error || 'YNS server request failed.');
  }

  return result;
}

export async function getIntegrationStatus() {
  const result = await apiRequest('/api/integrations/status');

  return result.connections || [];
}

export async function bootstrapIntegrations() {
  const result = await apiRequest('/api/integrations/bootstrap', {
    method: 'POST',
  });

  return result.connections || [];
}

export function findIntegration(connections, provider) {
  return connections.find((item) => item.provider === provider) || null;
}
