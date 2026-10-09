import * as alertRepository from '../repositories/alert.repository';
import * as centerRepository from '../repositories/center.repository';
import * as redistributionRepository from '../repositories/redistribution.repository';
import type { StatusLevel } from '../types';

export interface DashboardSummary {
  centers: {
    total: number;
    red: number;
    yellow: number;
    green: number;
  };
  pending_redistribution_requests: number;
  alerts_last_24h: number;
}

export async function getDashboard(): Promise<DashboardSummary> {
  const [centerStatuses, pendingRequests, alertsLast24h] = await Promise.all([
    centerRepository.countCenterStatuses(),
    redistributionRepository.countPendingRequests(),
    alertRepository.countAlertsLast24h(),
  ]);

  const counters: Record<StatusLevel, number> = centerStatuses;
  const total = counters.red + counters.yellow + counters.green;

  return {
    centers: {
      total,
      red: counters.red,
      yellow: counters.yellow,
      green: counters.green,
    },
    pending_redistribution_requests: pendingRequests,
    alerts_last_24h: alertsLast24h,
  };
}
