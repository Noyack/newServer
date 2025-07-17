import fs from 'fs';
import { hubspotClient } from './hubspot.service';


// Add this function to your hubspot.service.ts file
export const getContactProperties = async (): Promise<void> => {
  try {
    console.log('Fetching all contact properties from HubSpot...');
    const propertiesResponse = await hubspotClient.get('/crm/v3/properties/contacts');
    
    // Extract just the results array or the entire data object
    const properties = propertiesResponse.data;
    
    // Write to file with proper JSON formatting
    fs.writeFile(
      './hubspot-contact-properties.json', 
      JSON.stringify(properties, null, 2), 
      (err) => {
        if (err) {
          console.error('Error writing properties to file:', err);
        } else {
          console.log('Successfully wrote HubSpot properties to hubspot-contact-properties.json');
        }
      }
    );
    
    // Optionally log some basic stats
    console.log(`Found ${properties.results.length} contact properties in HubSpot`);
    
    // Log a few sample property names
    const sampleProperties = properties.results.slice(0, 5).map((p: { name: any; }) => p.name);
    console.log('Sample property names:', sampleProperties);
    
  } catch (error) {
    console.error('Error getting HubSpot contact properties:', error);
  }
};