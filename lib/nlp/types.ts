/**
 * Natural Language Processing Types
 * Defines the structure for NLP operations including intents, entities, and results
 */

export type IntentType =
  | 'search'      // Find tasks by keywords
  | 'filter'      // Apply filters (category, priority, date range)
  | 'create'      // Create new task
  | 'modify'      // Update existing task
  | 'delete'      // Remove task
  | 'navigate'    // Switch views/projects/columns
  | 'clear'       // Clear filters
  | 'unknown';    // Unable to determine intent

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'auto';

/**
 * Extracted entities from natural language input
 */
export interface ExtractedEntities {
  // Text content
  keywords?: string[];           // Search keywords
  taskTitle?: string;            // For create/modify intents
  description?: string;          // Task description

  // Task properties
  priority?: Priority;           // Task priority level
  categories?: string[];         // Category names (not IDs)

  // Date/Time
  dueDate?: Date;               // Parsed due date
  dateRange?: {
    start?: Date;
    end?: Date;
  };

  // References
  columnName?: string;          // Target column for task
  projectName?: string;         // Target project
  links?: Array<{ label: string; url: string }>;

  // Metadata
  confidence: number;           // 0-1, confidence in extraction
  ambiguities?: string[];       // List of ambiguous elements
}

/**
 * Intent recognition result
 */
export interface IntentResult {
  intent: IntentType;
  confidence: number;           // 0-1, confidence score
  entities: ExtractedEntities;
  rawQuery: string;             // Original query
  language: SupportedLanguage;  // Detected language
  suggestions?: string[];       // Alternative interpretations
  feedback?: string;            // Human-readable interpretation
}

/**
 * Pattern matching rule for intent classification
 */
export interface IntentPattern {
  intent: IntentType;
  patterns: RegExp[];
  weight: number;               // Higher weight = more specific/preferred
  requiredKeywords?: string[];  // Must contain at least one
  excludeKeywords?: string[];   // Cannot contain any
  languages?: SupportedLanguage[];
}

/**
 * Entity extraction rule
 */
export interface EntityPattern {
  type: keyof ExtractedEntities;
  patterns: RegExp[];
  extractor: (match: RegExpMatchArray, query: string) => any;
  weight: number;
}

/**
 * Multi-language keyword mapping
 */
export interface LanguageKeywords {
  [key: string]: {
    en: string[];
    es: string[];
    fr: string[];
    de: string[];
  };
}

/**
 * NLP Configuration
 */
export interface NLPConfig {
  defaultLanguage: SupportedLanguage;
  minConfidenceThreshold: number;  // Minimum confidence to act on intent
  maxSuggestions: number;          // Max alternative suggestions
  enableFuzzyMatching: boolean;    // Allow approximate string matching
  debugMode?: boolean;             // Log processing details
}

/**
 * Query processing result with actionable data
 */
export interface ProcessedQuery extends IntentResult {
  // Actionable data for the application
  actions: QueryAction[];
  requiresConfirmation: boolean;   // Whether to ask user before executing
  error?: string;                  // Error message if processing failed
  alternatives?: IntentType[];     // Alternative intent interpretations
}

/**
 * Action to be executed based on query
 */
export interface QueryAction {
  type: 'search' | 'filter' | 'create_task' | 'update_task' | 'delete_task' | 'navigate' | 'clear_filters';
  payload: any;
  description: string;             // Human-readable action description
  confidence: number;
}

/**
 * Query history entry
 */
export interface QueryHistoryEntry {
  id: string;
  query: string;
  result: ProcessedQuery;
  timestamp: Date;
  wasSuccessful: boolean;
}
