import { getConnectionSummary } from './connectionService';
import { getFollowupSummary } from './followupTaskService';
import { getLeadStages } from './leadStageService';

export async function getCrmDashboardSummary(userId) {
  if (!userId) throw new Error('A signed-in user is required.');
  const stages = await getLeadStages(userId);
  const wonStages = stages.filter((stage) => stage.is_won).map((stage) => stage.stage_key);
  const lostStages = stages.filter((stage) => stage.is_lost).map((stage) => stage.stage_key);
  const [leads, followups] = await Promise.all([
    getConnectionSummary(userId, wonStages, lostStages),
    getFollowupSummary(userId),
  ]);
  return {
    totalLeads: leads.total,
    won: leads.won,
    followups: followups.pending,
    overdue: followups.overdue,
  };
}
