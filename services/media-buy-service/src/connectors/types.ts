export interface CampaignInput {
  name: string;
  budget: number;
  objective: string;
}

export interface CampaignUpdate {
  name?: string;
  budget?: number;
  status?: 'active' | 'paused';
}

export interface StatsQuery {
  from: string; // ISO date
  to: string;   // ISO date
}

export interface Connector {
  createCampaign(input: CampaignInput): Promise<{ id: string }>;
  updateCampaign(id: string, input: CampaignUpdate): Promise<{ id: string }>;
  fetchStats(q: StatsQuery): Promise<{ spend: number; clicks: number; impressions: number; conversions: number }>;
}

