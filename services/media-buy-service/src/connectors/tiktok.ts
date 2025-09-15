import { Connector, CampaignInput, CampaignUpdate, StatsQuery } from './types.js';
import { v4 as uuidv4 } from 'uuid';

export const tiktokConnector: Connector = {
  async createCampaign(_input: CampaignInput) { return { id: `tt_${uuidv4()}` }; },
  async updateCampaign(id: string, _input: CampaignUpdate) { return { id }; },
  async fetchStats(_q: StatsQuery) { return { spend: 78.9, clicks: 120, impressions: 3456, conversions: 6 }; }
};

