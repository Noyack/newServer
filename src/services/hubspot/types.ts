// src/services/hubspot/types.ts

// Contact related types
export interface ContactProperties {
  email: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  website?: string;
  company?: string;
  jobtitle?: string;
  user_id?: string;
  [key: string]: string | undefined;
}

export interface ContactSearchFilter {
  propertyName: string;
  operator: 'EQ' | 'NEQ' | 'LT' | 'LTE' | 'GT' | 'GTE' | 'CONTAINS_TOKEN' | 'NOT_CONTAINS_TOKEN';
  value: string;
}

export interface ContactSearchFilterGroup {
  filters: ContactSearchFilter[];
}

export interface ContactSearchSort {
  propertyName: string;
  direction: 'ASCENDING' | 'DESCENDING';
}

export interface ContactSearchParams {
  filterGroups: ContactSearchFilterGroup[];
  sorts?: ContactSearchSort[];
  properties?: string[];
  limit?: number;
  after?: string;
}

export interface ContactSearchResult {
  results: Array<{
    id: string;
    properties: ContactProperties;
    createdAt: string;
    updatedAt: string;
    archived: boolean;
  }>;
  total: number;
  paging?: {
    next?: {
      after: string;
      link: string;
    };
  };
}

// Deal related types
export interface DealProperties {
  dealname: string;
  amount?: string;
  dealstage?: string;
  closedate?: string;
  pipeline?: string;
  dealtype?: string;
  description?: string;
  [key: string]: string | undefined;
}

export interface DealAssociation {
  to: {
    id: string;
  };
  types: Array<{
    associationCategory: string;
    associationTypeId: number;
  }>;
}

export interface CreateDealRequest {
  properties: DealProperties;
  associations?: DealAssociation[];
}

// Marketing Event related types
export interface MarketingEventData {
  eventName: string;
  eventType: string;
  startDateTime?: string;
  endDateTime?: string;
  eventOrganizer: string;
  eventDescription?: string;
  eventUrl?: string;
  eventCancelled?: boolean;
  customProperties?: Record<string, any>;
}

export interface MarketingEventResponse {
  results: Array<{
    id: string;
    eventName: string;
    eventType: string;
    startDateTime: string;
    endDateTime: string;
    eventOrganizer: string;
    eventDescription?: string;
    eventUrl?: string;
    eventCancelled: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  total: number;
  paging?: {
    next?: {
      after: string;
    };
  };
}

// Webhook related types
export interface WebhookPayload {
  eventId: string;
  subscriptionType: string;
  objectId: string;
  propertyName?: string;
  propertyValue?: string;
  changeSource?: string;
  subscriptionId?: number;
  attemptNumber?: number;
  eventType?: string;
  objectType?: string;
}

// Activity/Engagement related types
export interface ActivityMetadata {
  subject: string;
  body?: string;
  status?: string;
  forObjectType?: string;
  startTime?: number;
  endTime?: number;
  type?: string;
}

export interface ActivityRequest {
  engagement: {
    type: 'NOTE' | 'TASK' | 'MEETING' | 'CALL' | 'EMAIL';
    timestamp?: number;
  };
  associations: {
    contactIds?: string[];
    companyIds?: string[];
    dealIds?: string[];
    ticketIds?: string[];
  };
  metadata: ActivityMetadata;
}

// List related types
export interface ListMembership {
  vids: string[];
  emails?: string[];
}

// Error types
export interface HubSpotError {
  status: string;
  message: string;
  correlationId: string;
  category: string;
  subCategory?: string;
  errors?: Array<{
    message: string;
    errorType: string;
    context?: Record<string, any>;
  }>;
}

// API Response wrapper
export interface HubSpotApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

// Pipeline related types
export interface Pipeline {
  id: string;
  label: string;
  displayOrder: number;
  stages: PipelineStage[];
}

export interface PipelineStage {
  id: string;
  label: string;
  displayOrder: number;
  probability: number;
  closed: boolean;
}

// Company related types (for future expansion)
export interface CompanyProperties {
  name: string;
  domain?: string;
  city?: string;
  state?: string;
  country?: string;
  industry?: string;
  phone?: string;
  [key: string]: string | undefined;
}

// Ticket related types (for future expansion)
export interface TicketProperties {
  subject: string;
  content?: string;
  hs_pipeline?: string;
  hs_pipeline_stage?: string;
  hs_ticket_priority?: string;
  source_type?: string;
  [key: string]: string | undefined;
}