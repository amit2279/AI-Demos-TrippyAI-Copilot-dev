import { Message } from '../../types/chat';
import { COUNTRY_FLAGS } from '../cities/flags';

function addCountryFlags(text: string): string {
  let formattedText = text;
  Object.entries(COUNTRY_FLAGS).forEach(([country, flag]) => {
    const regex = new RegExp(`\\b${country}\\b(?![^<]*>)`, 'g');
    formattedText = formattedText.replace(regex, `${country} ${flag}`);
  });
  return formattedText;
}

interface FormatResult {
  displayContent: string;
  jsonContent?: string;
}


export function formatMessage(message: Message): FormatResult {
  if (message.sender !== 'bot') {
    return { displayContent: message.content };
  }
  
  const withFlags = addCountryFlags(message.content);
  const jsonStartIndex = withFlags.indexOf('{ "locations":');
  
  if (jsonStartIndex !== -1) {
    return {
      displayContent: withFlags.substring(0, jsonStartIndex).trim(),
      jsonContent: withFlags.substring(jsonStartIndex)
    };
  }
  
  return { displayContent: withFlags };
}

/*export function formatMessage(message: Message): string {
  console.log("message is called ", Message)
  if (message.sender !== 'bot') return message.content;
  
  // Add country flags to bot messages
  const withFlags = addCountryFlags(message.content);
  
  // Clean JSON data from display
  const jsonStartIndex = withFlags.indexOf('{ "locations":');
  if (jsonStartIndex !== -1) {
    return withFlags.substring(0, jsonStartIndex).trim();
  }
  
  return withFlags;
}
*/




