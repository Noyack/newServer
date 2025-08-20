// src/services/hubspot/pipelines.ts
import { hubspotClient } from './client';

export interface PipelineStage {
  id: string;
  label: string;
  displayOrder: number;
  metadata: {
    isClosed: string;
    probability: string;
  };
}

export interface Pipeline {
  id: string;
  label: string;
  displayOrder: number;
  stages: PipelineStage[];
}

/**
 * Get all ticket pipelines from HubSpot
 */
export const getTicketPipelines = async (): Promise<Pipeline[]> => {
  try {
    const response = await hubspotClient.get('/crm/v3/pipelines/tickets');
    return response.data.results || [];
  } catch (error:any) {
    console.error('Error fetching ticket pipelines:', error);
    throw new Error(`Failed to fetch ticket pipelines: ${error.message}`);
  }
};

/**
 * Get the default ticket pipeline and its stage IDs
 */
export const getDefaultTicketPipelineStages = async (): Promise<Record<string, string>> => {
  try {
    const pipelines = await getTicketPipelines();
    
    if (pipelines.length === 0) {
      throw new Error('No ticket pipelines found in HubSpot');
    }
    
    // Use the first pipeline (usually the default)
    const defaultPipeline = pipelines[0];
    const stages = defaultPipeline.stages;
    
    // Log the stages for debugging
    console.log('Available ticket pipeline stages:', stages.map(s => ({ id: s.id, label: s.label })));
    
    // Create a mapping - you may need to adjust this based on your stage names
    const stageMapping: Record<string, string> = {};
    
    // Try to map based on common stage names, fallback to order
    stages.forEach((stage, index) => {
      const label = stage.label.toLowerCase();
      
      if (label.includes('new') || label.includes('open') || index === 0) {
        stageMapping.open = stage.id;
      } else if (label.includes('progress') || label.includes('working') || index === 1) {
        stageMapping.in_progress = stage.id;
      } else if (label.includes('pending') || label.includes('waiting') || index === 2) {
        stageMapping.pending = stage.id;
      } else if (label.includes('closed') || label.includes('resolved') || index === stages.length - 1) {
        stageMapping.closed = stage.id;
      }
    });
    
    // Ensure we have at least an 'open' stage
    if (!stageMapping.open && stages.length > 0) {
      stageMapping.open = stages[0].id;
    }
    
    return stageMapping;
  } catch (error) {
    console.error('Error getting default pipeline stages:', error);
    // Return fallback mapping
    return {
      open: '1',
      in_progress: '2', 
      pending: '3',
      closed: '4'
    };
  }
};

/**
 * Get ticket pipeline stage mapping (cached version)
 */
let cachedStageMapping: Record<string, string> | null = null;

export const getTicketStageMapping = async (): Promise<Record<string, string>> => {
  if (!cachedStageMapping) {
    cachedStageMapping = await getDefaultTicketPipelineStages();
  }
  return cachedStageMapping;
};