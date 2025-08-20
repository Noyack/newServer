// src/services/hubspot/tickets.ts
import { hubspotClient } from './client';
import { TicketProperties } from './types';
import { getTicketStageMapping } from './pipeline';

export interface SupportTicketPayload {
  userId: string;
  email: string;
  category: string;
  subcategory: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'closed' | 'pending';
  subject: string;
  description: string;
  timestamp: string;
}

export interface HubSpotTicketResponse {
  id: string;
  properties: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Maps support ticket payload to HubSpot ticket properties
 */
const mapSupportTicketToHubSpot = async (ticket: SupportTicketPayload): Promise<TicketProperties> => {
  // Map priority levels to HubSpot values
  const priorityMapping = {
    'low': 'LOW',
    'medium': 'MEDIUM', 
    'high': 'HIGH',
    'urgent': 'HIGH' // HubSpot typically uses LOW/MEDIUM/HIGH
  };

  // Get dynamic stage mapping from HubSpot
  const stageMapping = await getTicketStageMapping();

  // Build the description with additional context since we can't use custom properties yet
  const enhancedDescription = `
Category: ${ticket.category}
${ticket.subcategory ? `Subcategory: ${ticket.subcategory}` : ''}
User ID: ${ticket.userId}
User Email: ${ticket.email}
Submitted: ${ticket.timestamp}

Description:
${ticket.description}
  `.trim();

  return {
    subject: ticket.subject,
    content: enhancedDescription,
    hs_ticket_priority: priorityMapping[ticket.priority] || 'MEDIUM',
    hs_pipeline_stage: stageMapping[ticket.status] || stageMapping.open || '1',
    source_type: 'FORM' // Using the correct HubSpot value for form submissions
  };
};

/**
 * Create a support ticket in HubSpot
 */
export const createSupportTicket = async (ticketData: SupportTicketPayload): Promise<HubSpotTicketResponse> => {
  try {
    const hubspotProperties = await mapSupportTicketToHubSpot(ticketData);
    
    const response = await hubspotClient.post('/crm/v3/objects/tickets', {
      properties: hubspotProperties
    });

    // Also try to associate with contact if they exist in HubSpot
    if (response.data.id) {
      await associateTicketWithContact(response.data.id, ticketData.email);
    }

    return response.data;
  } catch (error:any) {
    console.error('Error creating HubSpot ticket:', error);
    throw new Error(`Failed to create support ticket: ${error.message}`);
  }
};

/**
 * Associate ticket with contact by email
 */
const associateTicketWithContact = async (ticketId: string, email: string): Promise<void> => {
  try {
    // Search for contact by email
    const contactResponse = await hubspotClient.post('/crm/v3/objects/contacts/search', {
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'email',
              operator: 'EQ',
              value: email
            }
          ]
        }
      ]
    });

    if (contactResponse.data.results && contactResponse.data.results.length > 0) {
      const contactId = contactResponse.data.results[0].id;
      
      // Create association between ticket and contact
      await hubspotClient.put(`/crm/v4/objects/tickets/${ticketId}/associations/contacts/${contactId}`, {
        associationCategory: "HUBSPOT_DEFINED",
        associationTypeId: 16 // Standard ticket-to-contact association
      });
    }
  } catch (error:any) {
    console.warn('Warning: Could not associate ticket with contact:', error.message);
    // Don't throw here - ticket creation succeeded, association is optional
  }
};

/**
 * Get ticket by ID
 */
export const getTicketById = async (ticketId: string): Promise<HubSpotTicketResponse> => {
  try {
    const response = await hubspotClient.get(`/crm/v3/objects/tickets/${ticketId}`);
    return response.data;
  } catch (error:any) {
    console.error('Error fetching HubSpot ticket:', error);
    throw new Error(`Failed to fetch ticket: ${error.message}`);
  }
};

/**
 * Update ticket status or properties
 */
export const updateTicket = async (ticketId: string, properties: Partial<TicketProperties>): Promise<HubSpotTicketResponse> => {
  try {
    const response = await hubspotClient.patch(`/crm/v3/objects/tickets/${ticketId}`, {
      properties
    });
    return response.data;
  } catch (error:any) {
    console.error('Error updating HubSpot ticket:', error);
    throw new Error(`Failed to update ticket: ${error.message}`);
  }
};

/**
 * Get tickets for a user by email
 */
export const getTicketsForUser = async (email: string): Promise<HubSpotTicketResponse[]> => {
  try {
    const response = await hubspotClient.post('/crm/v3/objects/tickets/search', {
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'requester_email',
              operator: 'EQ',
              value: email
            }
          ]
        }
      ],
      sorts: [
        {
          propertyName: 'createdate',
          direction: 'DESCENDING'
        }
      ]
    });

    return response.data.results || [];
  } catch (error:any) {
    console.error('Error fetching user tickets:', error);
    throw new Error(`Failed to fetch user tickets: ${error.message}`);
  }
};