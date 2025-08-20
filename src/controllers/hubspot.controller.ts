// src/controllers/hubspot.controller.ts
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as contactsService from '../services/hubspot/contacts';
import * as dealsService from '../services/hubspot/deals';
import * as marketingService from '../services/hubspot/marketing';
import * as webhooksService from '../services/hubspot/webhooks';
import * as activitiesService from '../services/hubspot/activities';
import { createSupportTicket, getTicketsForUser, updateTicket, SupportTicketPayload } from '../services/hubspot/tickets';


/**
 * Webhook handler for HubSpot events
 */
export const handleHubspotWebhook = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const payload = req.body;
    
    // Handle array of webhooks or single webhook
    const webhooks = Array.isArray(payload) ? payload : [payload];
    
    for (const webhook of webhooks) {
      // Validate the webhook payload
      if (!webhook || !webhook.eventId) {
        continue;
      }
      
      // Process the webhook asynchronously
      await webhooksService.processHubspotWebhook(webhook);
    }
    
    // Respond to HubSpot immediately to acknowledge receipt
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling HubSpot webhook:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Manually sync a user with HubSpot
 */
export const syncUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId, email, firstName, lastName, additionalProperties } = req.body;
    
    if (!userId || !email) {
      res.status(400).json({ message: 'User ID and email are required' });
      return;
    }
    
    const contactId = await contactsService.syncUserWithHubspot(
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

/**
 * Create a deal for a contact
 */
export const createDeal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { contactId, dealName, amount, stage, properties } = req.body;
    
    if (!dealName) {
      res.status(400).json({ message: 'Deal name is required' });
      return;
    }
    
    let dealId: string;
    
    if (contactId) {
      dealId = await dealsService.createDealWithContact(
        contactId,
        dealName,
        amount,
        stage,
        properties
      );
    } else {
      dealId = await dealsService.createDeal(
        dealName,
        amount,
        stage,
        properties
      );
    }
    
    res.status(200).json({ success: true, dealId });
  } catch (error) {
    console.error('Error creating HubSpot deal:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get marketing events summary
 */
export const getEventsSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const events = await marketingService.getMarketingEvents();
    const response: { name: string; date: string; }[] = [];
    
    if (events && events.results && events.results.length > 0) {
      events.results.forEach((event: any) => {
        const date = event.startDateTime;
        response.unshift({
          name: event.eventName || 'Unnamed Event',
          date: date ? date.split("T")[0] : 'Unknown Date'
        });
      });
    }
    
    res.status(200).json({ response });
  } catch (error) {
    console.error('Error getting events summary:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get all marketing events
 */
export const getAllEvents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { limit, after } = req.query;
    const events = await marketingService.getMarketingEvents(
      limit ? parseInt(limit as string) : 100,
      after as string
    );
    
    res.status(200).json(events);
  } catch (error) {
    console.error('Error getting all events:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a new contact
 */
export const createContact = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { email, firstName, lastName, properties } = req.body;
    
    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }
    
    const contactId = await contactsService.createContact(email, firstName, lastName, properties);
    res.status(201).json({ success: true, contactId });
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get contact by ID
 */
export const getContact = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { contactId } = req.params;
    const { properties } = req.query;
    
    if (!contactId) {
      res.status(400).json({ message: 'Contact ID is required' });
      return;
    }
    
    const contact = await contactsService.getContactById(
      contactId,
      properties ? (properties as string).split(',') : undefined
    );
    
    res.status(200).json(contact);
  } catch (error) {
    console.error('Error getting contact:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update an existing contact
 */
export const updateContact = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { contactId } = req.params;
    const { properties } = req.body;
    
    if (!contactId) {
      res.status(400).json({ message: 'Contact ID is required' });
      return;
    }
    
    if (!properties) {
      res.status(400).json({ message: 'Properties are required' });
      return;
    }
    
    await contactsService.updateContact(contactId, properties);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Search contacts
 */
export const searchContacts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { email, filterGroups, sorts, properties, limit, after } = req.body;
    
    let searchResult;
    
    if (email) {
      // Simple email search
      searchResult = await contactsService.searchContactsByEmail(email);
    } else if (filterGroups) {
      // Advanced search
      searchResult = await contactsService.searchContacts({
        filterGroups,
        sorts,
        properties,
        limit,
        after
      });
    } else {
      res.status(400).json({ message: 'Either email or filterGroups must be provided' });
      return;
    }
    
    res.status(200).json(searchResult);
  } catch (error) {
    console.error('Error searching contacts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get all contacts with pagination
 */
export const getAllContacts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { limit, after, properties } = req.query;
    
    const contacts = await contactsService.getAllContacts(
      limit ? parseInt(limit as string) : 100,
      after as string,
      properties ? (properties as string).split(',') : undefined
    );
    
    res.status(200).json(contacts);
  } catch (error) {
    console.error('Error getting all contacts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Add contact to list
 */
export const addContactToList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { contactId, listId } = req.body;
    
    if (!contactId || !listId) {
      res.status(400).json({ message: 'Contact ID and List ID are required' });
      return;
    }
    
    await contactsService.addContactToList(contactId, listId);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error adding contact to list:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Remove contact from list
 */
export const removeContactFromList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { contactId, listId } = req.body;
    
    if (!contactId || !listId) {
      res.status(400).json({ message: 'Contact ID and List ID are required' });
      return;
    }
    
    await contactsService.removeContactFromList(contactId, listId);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error removing contact from list:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get deal by ID
 */
export const getDeal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { dealId } = req.params;
    const { properties } = req.query;
    
    if (!dealId) {
      res.status(400).json({ message: 'Deal ID is required' });
      return;
    }
    
    const deal = await dealsService.getDealById(
      dealId,
      properties ? (properties as string).split(',') : undefined
    );
    
    res.status(200).json(deal);
  } catch (error) {
    console.error('Error getting deal:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update an existing deal
 */
export const updateDeal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { dealId } = req.params;
    const { properties } = req.body;
    
    if (!dealId) {
      res.status(400).json({ message: 'Deal ID is required' });
      return;
    }
    
    if (!properties) {
      res.status(400).json({ message: 'Properties are required' });
      return;
    }
    
    await dealsService.updateDeal(dealId, properties);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating deal:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get all deals with pagination
 */
export const getAllDeals = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { limit, after, properties } = req.query;
    
    const deals = await dealsService.getAllDeals(
      limit ? parseInt(limit as string) : 100,
      after as string,
      properties ? (properties as string).split(',') : undefined
    );
    
    res.status(200).json(deals);
  } catch (error) {
    console.error('Error getting all deals:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Search deals
 */
export const searchDeals = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { filterGroups, sorts, properties, limit, after } = req.body;
    
    if (!filterGroups) {
      res.status(400).json({ message: 'Filter groups are required' });
      return;
    }
    
    const searchResult = await dealsService.searchDeals(
      filterGroups,
      sorts,
      properties,
      limit || 100,
      after
    );
    
    res.status(200).json(searchResult);
  } catch (error) {
    console.error('Error searching deals:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get deals for a specific contact
 */
export const getDealsForContact = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { contactId } = req.params;
    
    if (!contactId) {
      res.status(400).json({ message: 'Contact ID is required' });
      return;
    }
    
    const deals = await dealsService.getDealsForContact(contactId);
    res.status(200).json(deals);
  } catch (error) {
    console.error('Error getting deals for contact:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Log an activity for a contact
 */
export const logActivity = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { contactId, activityType, subject, notes } = req.body;
    
    if (!contactId || !activityType || !subject) {
      res.status(400).json({ 
        message: 'Contact ID, activity type, and subject are required' 
      });
      return;
    }
    
    const activityId = await activitiesService.logActivity(
      contactId,
      activityType,
      subject,
      notes
    );
    
    res.status(201).json({ success: true, activityId });
  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get deal pipelines
 */
export const getDealPipelines = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const pipelines = await dealsService.getDealPipelines();
    res.status(200).json(pipelines);
  } catch (error) {
    console.error('Error getting deal pipelines:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get deal stages for a pipeline
 */
export const getDealStages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { pipelineId } = req.params;
    
    if (!pipelineId) {
      res.status(400).json({ message: 'Pipeline ID is required' });
      return;
    }
    
    const stages = await dealsService.getDealStages(pipelineId);
    res.status(200).json(stages);
  } catch (error) {
    console.error('Error getting deal stages:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a support ticket in HubSpot
 */
export const createHubSpotSupportTicket = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const ticketData: any = req.body;
    
    // Validate required fields
    const requiredFields = ['userId', 'email', 'category', 'priority', 'subject', 'description'];
    const missingFields = requiredFields.filter(field => !ticketData[field]);
    
    if (missingFields.length > 0) {
      res.status(400).json({ 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(ticketData.email)) {
      res.status(400).json({ message: 'Invalid email format' });
      return;
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(ticketData.priority)) {
      res.status(400).json({ 
        message: 'Priority must be one of: low, medium, high, urgent' 
      });
      return;
    }

    // Create the ticket in HubSpot
    const hubspotTicket = await createSupportTicket(ticketData);
    
    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: {
        success: true,
        hubspotId: hubspotTicket.id,
        subject: ticketData.subject,
        status: ticketData.status || 'open',
        priority: ticketData.priority,
        createdAt: hubspotTicket.createdAt
      }
    });
  } catch (error:any) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({ 
      message: 'Failed to create support ticket', 
      error: error.message 
    });
  }
};

/**
 * Get support tickets for a user
 */
export const getUserSupportTickets = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { email } = req.query;
    
    if (!email || typeof email !== 'string') {
      res.status(400).json({ message: 'Email parameter is required' });
      return;
    }

    const tickets = await getTicketsForUser(email);
    
    res.status(200).json({
      success: true,
      count: tickets.length,
      tickets: tickets.map(ticket => ({
        id: ticket.id,
        subject: ticket.properties?.subject,
        status: ticket.properties?.hs_pipeline_stage,
        priority: ticket.properties?.hs_ticket_priority,
        category: ticket.properties?.category,
        subcategory: ticket.properties?.subcategory,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt
      }))
    });
  } catch (error:any) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({ 
      message: 'Failed to fetch support tickets', 
      error: error.message 
    });
  }
};

/**
 * Update a support ticket status
 */
