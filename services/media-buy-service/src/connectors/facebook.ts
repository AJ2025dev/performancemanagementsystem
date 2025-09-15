import { Connector, CampaignInput, CampaignUpdate, StatsQuery } from './types.js';
import { v4 as uuidv4 } from 'uuid';

export const facebookConnector: Connector = {
  async createCampaign(input: CampaignInput) {
    return { id: `fb_${uuidv4()}` };
  },
  async updateCampaign(id: string, _input: CampaignUpdate) {
    return { id };
  },
  async fetchStats(_q: StatsQuery) {
    return { spend: 123.45, clicks: 789, impressions: 12345, conversions: 12 };
  }
};

