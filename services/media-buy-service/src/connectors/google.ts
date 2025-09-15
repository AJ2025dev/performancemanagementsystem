import { Connector, CampaignInput, CampaignUpdate, StatsQuery } from './types.js';
import { v4 as uuidv4 } from 'uuid';

export const googleConnector: Connector = {
  async createCampaign(_input: CampaignInput) { return { id: `gg_${uuidv4()}` }; },
  async updateCampaign(id: string, _input: CampaignUpdate) { return { id }; },
  async fetchStats(_q: StatsQuery) { return { spend: 456.78, clicks: 456, impressions: 67890, conversions: 34 }; }
};

