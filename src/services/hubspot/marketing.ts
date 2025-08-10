import { hubspotClient } from './client';
import { MarketingEventData } from './types';

export const getMarketingEvents = async (limit: number = 100, after?: string): Promise<any> => {
  try {
    const params: any = { limit };
    if (after) {
      params.after = after;
    }

    // Use the correct endpoint with trailing slash
    const response = await hubspotClient.get('/marketing/v3/marketing-events/', {
      params,
    });
    return response.data;
  } catch (error) {
    console.error('Error getting marketing events:', error);
    throw error;
  }
};

export const getMarketingEventById = async (eventId: string): Promise<any> => {
  try {
    const response = await hubspotClient.get(`/marketing/v3/marketing-events/events/${eventId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting marketing event by ID:', error);
    throw error;
  }
};

export const createMarketingEvent = async (eventData: MarketingEventData): Promise<any> => {
  try {
    const response = await hubspotClient.post('/marketing/v3/marketing-events/events', eventData);
    return response.data;
  } catch (error) {
    console.error('Error creating marketing event:', error);
    throw error;
  }
};

export const getMarketingEventsByDateRange = async (
  startDate: string, 
  endDate: string, 
  limit: number = 100
): Promise<any> => {
  try {
    const allEvents = await getMarketingEvents(limit);
    if (!allEvents.results) return { results: [] };

    const filteredEvents = allEvents.results.filter((event: any) => {
      if (!event.startDateTime) return false;
      
      const eventDate = new Date(event.startDateTime);
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      return eventDate >= start && eventDate <= end;
    });

    return { ...allEvents, results: filteredEvents };
  } catch (error) {
    console.error('Error getting marketing events by date range:', error);
    throw error;
  }
};