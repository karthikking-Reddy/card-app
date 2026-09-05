import { supabase } from '../../lib/supabase';

export async function getFollowupTasks(userId) {
  const { data, error } = await supabase
    .from('followup_tasks')
    .select(
      `
      *,
      connections (
        id,
        name,
        phone,
        email,
        company,
        stage
      )
    `
    )
    .eq('user_id', userId)
    .order('due_at', {
      ascending: true,
      nullsFirst: false,
    });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getConnectionFollowups(userId, connectionId) {
  const { data, error } = await supabase
    .from('followup_tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('connection_id', connectionId)
    .order('due_at', {
      ascending: true,
      nullsFirst: false,
    });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function createFollowupTask(userId, connectionId, values) {
  const { data, error } = await supabase
    .from('followup_tasks')
    .insert({
      user_id: userId,
      connection_id: connectionId,
      title: values.title,
      description: values.description || null,
      due_at: values.due_at || null,
      priority: values.priority || 'normal',
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateFollowupTask(taskId, values) {
  const { data, error } = await supabase
    .from('followup_tasks')
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function completeFollowupTask(taskId) {
  return updateFollowupTask(taskId, {
    status: 'completed',
    completed_at: new Date().toISOString(),
  });
}

export async function reopenFollowupTask(taskId) {
  return updateFollowupTask(taskId, {
    status: 'pending',
    completed_at: null,
  });
}

export async function deleteFollowupTask(taskId) {
  const { error } = await supabase.from('followup_tasks').delete().eq('id', taskId);

  if (error) {
    throw error;
  }
}
