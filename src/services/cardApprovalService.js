import { supabase } from '../../lib/supabase';

function approvalError(message) {
  return new Error(message);
}

export async function getCardApprovalStatus(cardId) {
  const { data, error } = await supabase
    .from('digital_cards')
    .select('id,approval_status,approval_requested_at,approved_at,approved_by,rejection_reason')
    .eq('id', cardId)
    .single();

  if (error) throw approvalError('Unable to load the card approval status.');
  return data;
}

export async function requestCardApproval(cardId) {
  const { data, error } = await supabase.rpc('request_card_approval', {
    p_card_id: cardId,
  });

  if (error) throw approvalError('Unable to submit the card for approval.');
  return data;
}

export async function getPendingCardApprovals() {
  const { data, error } = await supabase.rpc('get_pending_card_approvals');
  if (error) throw approvalError('Unable to load pending card approvals.');
  return data || [];
}

export async function approveCard(cardId) {
  const { data, error } = await supabase.rpc('approve_card', {
    p_card_id: cardId,
  });

  if (error) throw approvalError('Unable to approve this card.');
  return data;
}

export async function rejectCard(cardId, reason) {
  const cleanReason = String(reason || '').trim();
  if (!cleanReason) throw approvalError('A rejection reason is required.');

  const { data, error } = await supabase.rpc('reject_card', {
    p_card_id: cardId,
    p_reason: cleanReason,
  });

  if (error) throw approvalError('Unable to reject this card.');
  return data;
}
