
import { KoboProject } from '../types';

type LocalizedText = { [lang: string]: string } | string | undefined;

/**
 * Gets the localized text for a given language code.
 * Falls back to 'default' or the first available language if the specified language is not found.
 * This version is hardened to always return a string and never an object, preventing React render errors.
 * Appends cultural context if regionalSettings provided.
 * @param textObj The object containing translations, e.g., { default: 'Name', fr: 'Nom' }
 * @param lang The desired language code, e.g., 'fr'.
 * @param regionalSettings Optional regional settings for cultural adaptation.
 * @returns The localized string, guaranteed to be a string.
 */
export const getLocalizedText = (textObj: LocalizedText, lang: string, regionalSettings?: KoboProject['regionalSettings']): string => {
  // 1. Handle string input directly
  if (typeof textObj === 'string') {
    let result = textObj;
    if (regionalSettings?.culturalContext) {
      result += ` (${regionalSettings.culturalContext})`;
    }
    if (regionalSettings?.localTerms && regionalSettings.localTerms.length > 0) {
      result += ` [Termes locaux: ${regionalSettings.localTerms.join(', ')}]`;
    }
    return result;
  }

  // 2. Handle invalid inputs (null, undefined, not an object, array)
  if (!textObj || typeof textObj !== 'object' || Array.isArray(textObj)) {
    return '';
  }

  // 3. Attempt to find a valid string value in a specific order
  let result: unknown;

  // Prioritize exact language match if it's a string
  if (Object.prototype.hasOwnProperty.call(textObj, lang)) {
    const value = (textObj as any)[lang];
    if (typeof value === 'string') {
      result = value;
    }
  }

  // Fallback to 'default' if no specific language string was found
  if (result === undefined && Object.prototype.hasOwnProperty.call(textObj, 'default')) {
    const value = (textObj as any)['default'];
    if (typeof value === 'string') {
      result = value;
    }
  }
  
  // Fallback to the first available string property if still nothing found
  if (result === undefined) {
    for (const key in textObj) {
      if (Object.prototype.hasOwnProperty.call(textObj, key)) {
        const value = (textObj as any)[key];
        if (typeof value === 'string') {
          result = value;
          break; // Found one, exit loop
        }
      }
    }
  }

  // 4. Ensure the final result is always a string, then append cultural context
  let finalResult = typeof result === 'string' ? result : '';
  if (regionalSettings?.culturalContext) {
    finalResult += ` (${regionalSettings.culturalContext})`;
  }
  if (regionalSettings?.localTerms && regionalSettings.localTerms.length > 0) {
    finalResult += ` [Termes locaux: ${regionalSettings.localTerms.join(', ')}]`;
  }
  return finalResult;
};


/**
 * Sets or updates the text for a specific language in a translation object.
 * @param textObj The original object containing translations.
 * @param lang The language code to update.
 * @param value The new string value.
 * @returns A new translation object with the updated value.
 */
export const setLocalizedText = (textObj: LocalizedText, lang: string, value: string): { [lang: string]: string } => {
  const newTextObj = (typeof textObj === 'object' && textObj !== null) ? { ...textObj } : {};
  if (typeof textObj === 'string') {
      newTextObj['default'] = textObj;
  }
  newTextObj[lang] = value;
  return newTextObj;
};
