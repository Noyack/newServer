import { Response } from 'express';
import * as hubspotService from '../services/hubspot/index';
import { AuthenticatedRequest } from '../middleware/auth';

// Webhook handler for HubSpot events

interface Events {
  appInfo: {id:number,name:string}
  attendees:number
  cancellations: number
  createdAt: string
  customProperties?: any[]
  endDateTime: string,
  eventCancelled: boolean
  eventCompleted: boolean
  eventDescription: string
  eventName: string
  eventOrganizer: string
  eventStatus: string
  eventType: string
  eventUrl: string
  externalEventId: string
  noShows: number
  objectId:string
  registrants: number
  startDateTime: string
  updatedAt: string
}

export const handleHubspotWebhook = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const payload = req.body;
    for (let x of payload){

        
        // Validate the webhook payload
        if (!x || !x.eventId) {
            console.log(x)
            res.status(400).json({ message: 'Invalid webhook payload' });
            return;
        }
        
        // Process the webhook asynchronously
        await hubspotService.processHubspotWebhook(x);
        
        // Respond to HubSpot immediately to acknowledge receipt
        // res.status(200).json({ success: true });
    }
  } catch (error) {
    console.error('Error handling HubSpot webhook:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Manually sync a user with HubSpot
export const syncUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId, email, firstName, lastName, additionalProperties } = req.body;
    
    if (!userId || !email) {
      res.status(400).json({ message: 'User ID and email are required' });
      return;
    }
    
    const contactId = await hubspotService.syncUserWithHubspot(
      userId,
      email,
      firstName,
      lastName,
      additionalProperties
    );
    
    res.status(200).json({ success: true, contactId });
  } catch (error) {
    console.error('Error syncing user with HubSpot:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create a deal for a contact
export const createDeal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { contactId, dealName, amount, stage, properties } = req.body;
    
    if (!contactId || !dealName) {
      res.status(400).json({ message: 'Contact ID and deal name are required' });
      return;
    }
    
    const dealId = await hubspotService.createDeal(
      contactId,
      dealName,
      amount,
      stage,
      properties
    );
    
    res.status(200).json({ success: true, dealId });
  } catch (error) {
    console.error('Error creating HubSpot deal:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getEventsSummary = async (req: AuthenticatedRequest, res: Response)=> {
  try {
    const events = await hubspotService.getMarketingEvents();
    const response: { name: string; date: string; }[] = []
    if (events && events.results && events.results.length > 0){
      events.results.forEach((event: any, index: number) => {
        const date=  event.startDateTime
        response.unshift({name: event.eventName || 'Unnamed Event', date: date.split("T")[0]})
      })
    }
    res.status(200).json({response})
    // res.status(200).json({ success: true, events });
  } catch (error) {
    console.error('Error fetching events summaries in HubSpot:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllEvents = async (req: AuthenticatedRequest, res: Response)=> {
  try {
    const events = await hubspotService.getMarketingEvents();
    const response: any = []
    if (events && events.results && events.results.length > 0){
      events.results.forEach((event: Events, index: number) => {
        const startdate=  event.startDateTime
        const date = startdate.split("T")[0]
        const time = startdate.split("T")[1]
        response.unshift({
          id: event.appInfo.id,
          title: event.eventName,
          description: event.eventDescription,
          date: date,
          time: time,
          location: event.customProperties?.length&&event.customProperties?.length>0?event.customProperties[0].value:"",
          type: event.eventType,
          status: event.eventStatus,
          registrationUrl: event.eventUrl,
          imageUrl: "",
          attendeeCount: 0,
          maxAttendees: 0,
          tags: [],
          speaker: {
            name: "",
            title: "",
            imageUrl: ""
          }
        })
      })
    }
    res.status(200).json({response})
    // res.status(200).json({ success: true, events });
  } catch (error) {
    console.error('Error fetching all events in hubspot:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};