import { hubspotClient } from './client';

export const logActivity = async (
  contactId: string,
  activityType: string,
  subject: string,
  notes?: string
): Promise<string> => {
  try {
    const response = await hubspotClient.post('/engagements/v1/engagements', {
      engagement: {
        type: activityType, // 'NOTE', 'TASK', 'MEETING', 'CALL', 'EMAIL'
      },
      associations: {
        contactIds: [contactId],
      },
      metadata: {
        subject,
        body: notes || '',
      },
    });

    return response.data.engagement.id;
  } catch (error) {
    console.error('Error logging HubSpot activity:', error);
    throw error;
  }
};