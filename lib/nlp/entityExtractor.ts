/**
 * Entity Extraction
 * Extracts structured data from natural language queries
 */

import { ExtractedEntities, Priority } from './types';
import { priorityKeywords, stopwords, taskObjects, getKeywords } from './languagePatterns';
import { parseNaturalDate, parseDateRange } from './dateParser';

/**
 * Extract entities from query text
 */
export function extractEntities(
  query: string,
  language: 'en' | 'es' | 'fr' | 'de' = 'en'
): ExtractedEntities {
  const lowerQuery = query.toLowerCase();
  const entities: ExtractedEntities = {
    confidence: 0,
    ambiguities: [],
  };

  // Extract priority
  const priority = extractPriority(lowerQuery, language);
  if (priority) {
    entities.priority = priority;
    entities.confidence += 0.2;
  }

  // Extract dates
  const dueDate = parseNaturalDate(lowerQuery, language);
  if (dueDate) {
    entities.dueDate = dueDate;
    entities.confidence += 0.15;
  }

  // Extract date range
  const dateRange = parseDateRange(lowerQuery, language);
  if (dateRange) {
    entities.dateRange = dateRange;
    entities.confidence += 0.15;
  }

  // Extract keywords (remove stopwords and known entities)
  const keywords = extractKeywords(query, language);
  if (keywords.length > 0) {
    entities.keywords = keywords;
    entities.confidence += 0.2;
  }

  // Extract categories (quoted strings or capitalized words)
  const categories = extractCategories(query);
  if (categories.length > 0) {
    entities.categories = categories;
    entities.confidence += 0.15;
  }

  // Extract column name
  const columnName = extractColumnName(query, language);
  if (columnName) {
    entities.columnName = columnName;
    entities.confidence += 0.1;
  }

  // Extract task title for create operations
  const taskTitle = extractTaskTitle(query, language);
  if (taskTitle) {
    entities.taskTitle = taskTitle;
    entities.confidence += 0.15;
  }

  // Extract description
  const description = extractDescription(query, language);
  if (description) {
    entities.description = description;
    entities.confidence += 0.1;
  }

  // Extract links
  const links = extractLinks(query);
  if (links.length > 0) {
    entities.links = links;
    entities.confidence += 0.1;
  }

  // Normalize confidence to 0-1 range
  entities.confidence = Math.min(entities.confidence, 1);

  return entities;
}

/**
 * Extract priority from query
 */
function extractPriority(query: string, language: 'en' | 'es' | 'fr' | 'de'): Priority | undefined {
  const priorities: Priority[] = ['critical', 'high', 'medium', 'low'];

  for (const priority of priorities) {
    const keywords = priorityKeywords[priority][language];
    for (const keyword of keywords) {
      if (query.includes(keyword)) {
        return priority;
      }
    }
  }

  return undefined;
}

/**
 * Extract keywords (content words, not stopwords)
 */
function extractKeywords(query: string, language: 'en' | 'es' | 'fr' | 'de'): string[] {
  // Remove special characters and split
  const words = query
    .toLowerCase()
    .replace(/[^\w\sáéíóúñüàèìòùâêîôûäëïöü]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);

  // Filter out stopwords
  const languageStopwords = stopwords[language] || stopwords.en;
  const filtered = words.filter(word => !languageStopwords.includes(word));

  // Remove duplicates
  return [...new Set(filtered)];
}

/**
 * Extract category names (quoted strings, hashtags, or context clues)
 */
function extractCategories(query: string): string[] {
  const categories: string[] = [];

  // Extract quoted strings
  const quotedMatches = query.match(/"([^"]+)"|'([^']+)'/g);
  if (quotedMatches) {
    categories.push(...quotedMatches.map(m => m.replace(/["']/g, '')));
  }

  // Extract hashtags
  const hashtagMatches = query.match(/#(\w+)/g);
  if (hashtagMatches) {
    categories.push(...hashtagMatches.map(m => m.substring(1)));
  }

  // Extract words after "category:", "tag:", "label:"
  const categoryMatch = query.match(/(?:category|tag|label|categoría|etiqueta|catégorie):\s*(\w+)/i);
  if (categoryMatch) {
    categories.push(categoryMatch[1]);
  }

  return [...new Set(categories)];
}

/**
 * Extract column name from query
 */
function extractColumnName(query: string, language: 'en' | 'es' | 'fr' | 'de'): string | undefined {
  // Common column names
  const commonColumns = {
    en: ['to do', 'todo', 'in progress', 'doing', 'done', 'completed', 'backlog', 'review'],
    es: ['por hacer', 'en progreso', 'haciendo', 'hecho', 'completado', 'pendiente'],
    fr: ['à faire', 'en cours', 'fait', 'terminé', 'en attente'],
    de: ['zu tun', 'in arbeit', 'erledigt', 'fertig', 'wartend'],
  };

  const lowerQuery = query.toLowerCase();

  for (const column of commonColumns[language]) {
    if (lowerQuery.includes(column)) {
      return column;
    }
  }

  // Look for "in [column name]" or "to [column name]"
  const columnMatch = query.match(/(?:in|to|move to|en|a|mover a|dans|vers|déplacer vers|nach|zu|verschieben nach)\s+"([^"]+)"|(?:in|to)\s+(\w+(?:\s+\w+)?)/i);
  if (columnMatch) {
    return columnMatch[1] || columnMatch[2];
  }

  return undefined;
}

/**
 * Extract task title from create queries
 */
function extractTaskTitle(query: string, language: 'en' | 'es' | 'fr' | 'de'): string | undefined {
  // Look for quoted title
  const quotedMatch = query.match(/"([^"]+)"|'([^']+)'/);
  if (quotedMatch) {
    return quotedMatch[1] || quotedMatch[2];
  }

  // Look for "called", "named", "titled"
  const namedMatch = query.match(/(?:called|named|titled|llamado|llamada|nombrado|appelé|nommé|genannt)\s+"?([^"]+)"?/i);
  if (namedMatch) {
    return namedMatch[1].replace(/["']$/, '').trim();
  }

  // For "create/add [task title]" pattern
  const createKeywords = getKeywords('create', language);
  for (const keyword of createKeywords) {
    const pattern = new RegExp(`${keyword}\\s+(?:task|todo|tarea)?\\s*:?\\s*(.+)`, 'i');
    const match = query.match(pattern);
    if (match) {
      // Clean up the title
      let title = match[1].trim();
      title = title.replace(/\s+with\s+.+$|\s+en\s+.+$|\s+avec\s+.+$|\s+mit\s+.+$/i, '');
      title = title.replace(/^["']|["']$/g, '');
      return title;
    }
  }

  return undefined;
}

/**
 * Extract description from query
 */
function extractDescription(query: string, language: 'en' | 'es' | 'fr' | 'de'): string | undefined {
  const descPatterns = [
    /(?:description|desc|details|descripción|détails|beschreibung):\s*"?([^"]+)"?/i,
    /(?:with description|con descripción|avec description|mit beschreibung)\s+"?([^"]+)"?/i,
  ];

  for (const pattern of descPatterns) {
    const match = query.match(pattern);
    if (match) {
      return match[1].replace(/["']$/g, '').trim();
    }
  }

  return undefined;
}

/**
 * Extract URLs from query
 */
function extractLinks(query: string): Array<{ label: string; url: string }> {
  const links: Array<{ label: string; url: string }> = [];

  // Match URLs
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const urls = query.match(urlPattern);

  if (urls) {
    urls.forEach((url, index) => {
      links.push({
        label: `Link ${index + 1}`,
        url: url,
      });
    });
  }

  return links;
}

/**
 * Fuzzy match string against a list of options
 */
export function fuzzyMatch(input: string, options: string[], threshold: number = 0.6): string[] {
  const lowerInput = input.toLowerCase();
  const matches: Array<{ option: string; score: number }> = [];

  for (const option of options) {
    const lowerOption = option.toLowerCase();

    // Exact match
    if (lowerOption === lowerInput) {
      matches.push({ option, score: 1 });
      continue;
    }

    // Contains match
    if (lowerOption.includes(lowerInput) || lowerInput.includes(lowerOption)) {
      const score = Math.max(lowerInput.length / lowerOption.length, lowerOption.length / lowerInput.length);
      matches.push({ option, score: score * 0.8 });
      continue;
    }

    // Levenshtein distance
    const distance = levenshteinDistance(lowerInput, lowerOption);
    const maxLength = Math.max(lowerInput.length, lowerOption.length);
    const similarity = 1 - distance / maxLength;

    if (similarity >= threshold) {
      matches.push({ option, score: similarity });
    }
  }

  return matches
    .sort((a, b) => b.score - a.score)
    .map(m => m.option);
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}
