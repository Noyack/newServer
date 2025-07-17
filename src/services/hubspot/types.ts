export interface ContactProperties {
  email: string;
  firstname?: string;
  lastname?: string;
  [key: string]: string | undefined;
}

export interface DealProperties {
  dealname: string;
  amount?: string;
  dealstage?: string;
  [key: string]: string | undefined;
}

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

export interface WebhookPayload {
  eventId: string;
  subscriptionType: string;
  objectId: string;
  propertyName?: string;
  propertyValue?: string;
}