import axios from 'axios';
import { config } from '../../config';

// Base URL for HubSpot API
const HUBSPOT_API_URL = 'https://api.hubapi.com';

// Create an axios instance for HubSpot
export const hubspotClient = axios.create({
  baseURL: HUBSPOT_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.hubspotApiKey}`,
  },
});