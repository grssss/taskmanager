/**
 * Main NLP Processor
 * Orchestrates intent classification, entity extraction, and query processing
 */

import { ProcessedQuery, NLPConfig, QueryAction, IntentType } from './types';
import { detectLanguage } from './languagePatterns';
import { classifyIntent, generateIntentFeedback } from './intentClassifier';
import { extractEntities, fuzzyMatch } from './entityExtractor';
import type { Category, Column, Card, Priority } from '../types';

/**
 * Default NLP configuration
 */
const defaultConfig: NLPConfig = {
  defaultLanguage: 'en',
  minConfidenceThreshold: 0.3,
  maxSuggestions: 3,
  enableFuzzyMatching: true,
  debugMode: false,
};

/**
 * Main NLP Processor class
 */
export class NLPProcessor {
  private config: NLPConfig;

  constructor(config: Partial<NLPConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Process a natural language query
   */
  processQuery(
    query: string,
    context: {
      categories: Category[];
      columns: Column[];
      cards: Record<string, Card>;
    }
  ): ProcessedQuery {
    // Detect language
    const language = detectLanguage(query);

    if (this.config.debugMode) {
      console.log('Detected language:', language);
    }

    // Classify intent
    const { intent, confidence, alternatives } = classifyIntent(query, language);

    if (this.config.debugMode) {
      console.log('Intent:', intent, 'Confidence:', confidence);
      console.log('Alternatives:', alternatives);
    }

    // Extract entities
    const entities = extractEntities(query, language);

    if (this.config.debugMode) {
      console.log('Extracted entities:', entities);
    }

    // Match entities to actual data
    this.enrichEntities(entities, context);

    // Generate feedback
    const feedback = generateIntentFeedback(intent, query, language);

    // Convert to actions
    const actions = this.generateActions(intent, entities, context);

    // Generate suggestions
    const suggestions = this.generateSuggestions(intent, entities, alternatives, query, context);

    // Determine if confirmation is needed
    const requiresConfirmation = this.needsConfirmation(intent, entities, actions);

    // Check for errors
    const error = this.validateQuery(intent, entities, context);

    // Calculate overall confidence
    const overallConfidence = (confidence + entities.confidence) / 2;

    return {
      intent,
      confidence: overallConfidence,
      entities,
      rawQuery: query,
      language,
      suggestions,
      feedback,
      actions,
      requiresConfirmation,
      error,
      alternatives: alternatives.map(a => a.intent),
    };
  }

  /**
   * Enrich entities by matching them to actual data
   */
  private enrichEntities(
    entities: any,
    context: { categories: Category[]; columns: Column[]; cards: Record<string, Card> }
  ): void {
    // Match category names to actual categories
    if (entities.categories && entities.categories.length > 0) {
      const categoryNames = context.categories.map(c => c.name);
      const matchedCategories: string[] = [];

      for (const catName of entities.categories) {
        if (this.config.enableFuzzyMatching) {
          const matches = fuzzyMatch(catName, categoryNames, 0.6);
          if (matches.length > 0) {
            matchedCategories.push(matches[0]);
          }
        } else {
          const exact = categoryNames.find(c => c.toLowerCase() === catName.toLowerCase());
          if (exact) {
            matchedCategories.push(exact);
          }
        }
      }

      if (matchedCategories.length > 0) {
        entities.categories = matchedCategories;
        entities.confidence += 0.1;
      } else {
        entities.ambiguities = entities.ambiguities || [];
        entities.ambiguities.push(`Category "${entities.categories[0]}" not found`);
      }
    }

    // Match column names
    if (entities.columnName) {
      const columnNames = context.columns.map(c => c.name);
      if (this.config.enableFuzzyMatching) {
        const matches = fuzzyMatch(entities.columnName, columnNames, 0.6);
        if (matches.length > 0) {
          entities.columnName = matches[0];
          entities.confidence += 0.1;
        } else {
          entities.ambiguities = entities.ambiguities || [];
          entities.ambiguities.push(`Column "${entities.columnName}" not found`);
        }
      } else {
        const exact = columnNames.find(c => c.toLowerCase() === entities.columnName.toLowerCase());
        if (exact) {
          entities.columnName = exact;
          entities.confidence += 0.1;
        }
      }
    }
  }

  /**
   * Generate actionable commands from intent and entities
   */
  private generateActions(
    intent: IntentType,
    entities: any,
    context: { categories: Category[]; columns: Column[]; cards: Record<string, Card> }
  ): QueryAction[] {
    const actions: QueryAction[] = [];

    switch (intent) {
      case 'search':
        if (entities.keywords && entities.keywords.length > 0) {
          actions.push({
            type: 'search',
            payload: { keywords: entities.keywords },
            description: `Search for tasks containing: ${entities.keywords.join(', ')}`,
            confidence: entities.confidence,
          });
        }
        break;

      case 'filter':
        const filters: any = {};

        if (entities.categories && entities.categories.length > 0) {
          // Convert category names to IDs
          const categoryIds = entities.categories
            .map((name: string) => context.categories.find(c => c.name === name)?.id)
            .filter(Boolean);
          if (categoryIds.length > 0) {
            filters.categories = categoryIds;
          }
        }

        if (entities.priority) {
          filters.priority = entities.priority;
        }

        if (entities.dateRange) {
          filters.dateRange = entities.dateRange;
        }

        if (Object.keys(filters).length > 0) {
          actions.push({
            type: 'filter',
            payload: filters,
            description: this.describeFilters(filters, context),
            confidence: entities.confidence,
          });
        }
        break;

      case 'clear':
        actions.push({
          type: 'clear_filters',
          payload: {},
          description: 'Clear all active filters',
          confidence: 1,
        });
        break;

      case 'create':
        if (entities.taskTitle) {
          const taskData: any = {
            title: entities.taskTitle,
          };

          if (entities.description) {
            taskData.description = entities.description;
          }

          if (entities.priority) {
            taskData.priority = entities.priority;
          }

          if (entities.dueDate) {
            taskData.dueDate = entities.dueDate.toISOString();
          }

          if (entities.categories && entities.categories.length > 0) {
            const categoryIds = entities.categories
              .map((name: string) => context.categories.find(c => c.name === name)?.id)
              .filter(Boolean);
            if (categoryIds.length > 0) {
              taskData.categoryIds = categoryIds;
            }
          }

          if (entities.links) {
            taskData.links = entities.links;
          }

          if (entities.columnName) {
            const column = context.columns.find(c => c.name === entities.columnName);
            if (column) {
              taskData.columnId = column.id;
            }
          }

          actions.push({
            type: 'create_task',
            payload: taskData,
            description: `Create task: "${entities.taskTitle}"`,
            confidence: entities.confidence,
          });
        }
        break;

      case 'modify':
        // For modify, we need to search first, then present options
        if (entities.keywords && entities.keywords.length > 0) {
          actions.push({
            type: 'search',
            payload: { keywords: entities.keywords, forModification: true },
            description: `Find tasks to modify matching: ${entities.keywords.join(', ')}`,
            confidence: entities.confidence * 0.8,
          });
        }
        break;

      case 'delete':
        if (entities.keywords && entities.keywords.length > 0) {
          actions.push({
            type: 'search',
            payload: { keywords: entities.keywords, forDeletion: true },
            description: `Find tasks to delete matching: ${entities.keywords.join(', ')}`,
            confidence: entities.confidence * 0.8,
          });
        }
        break;

      case 'navigate':
        // Navigation would be handled by the UI
        break;
    }

    return actions;
  }

  /**
   * Generate alternative suggestions
   */
  private generateSuggestions(
    intent: IntentType,
    entities: any,
    alternatives: Array<{ intent: IntentType; confidence: number }>,
    query: string,
    context: any
  ): string[] {
    const suggestions: string[] = [];

    // Add ambiguity clarifications
    if (entities.ambiguities && entities.ambiguities.length > 0) {
      suggestions.push(...entities.ambiguities.slice(0, this.config.maxSuggestions));
    }

    // Suggest alternative intents if confidence is low
    if (entities.confidence < 0.5 && alternatives.length > 0) {
      const altIntent = alternatives[0].intent;
      suggestions.push(`Did you mean to ${altIntent} instead?`);
    }

    // Suggest available categories if none matched
    if (intent === 'filter' && entities.categories && entities.categories.length === 0) {
      const availableCategories = context.categories.map((c: Category) => c.name).slice(0, 3);
      if (availableCategories.length > 0) {
        suggestions.push(`Available categories: ${availableCategories.join(', ')}`);
      }
    }

    return suggestions.slice(0, this.config.maxSuggestions);
  }

  /**
   * Check if the query needs user confirmation before executing
   */
  private needsConfirmation(intent: IntentType, entities: any, actions: QueryAction[]): boolean {
    // Delete operations always need confirmation
    if (intent === 'delete') {
      return true;
    }

    // Modify operations need confirmation
    if (intent === 'modify') {
      return true;
    }

    // Create with low confidence needs confirmation
    if (intent === 'create' && entities.confidence < 0.6) {
      return true;
    }

    // No actions generated
    if (actions.length === 0) {
      return false;
    }

    // Low confidence actions need confirmation
    const hasLowConfidence = actions.some(a => a.confidence < 0.5);
    return hasLowConfidence;
  }

  /**
   * Validate query and return error if invalid
   */
  private validateQuery(
    intent: IntentType,
    entities: any,
    context: any
  ): string | undefined {
    // Create without title
    if (intent === 'create' && !entities.taskTitle) {
      return 'Please specify a task title to create';
    }

    // Filter without criteria
    if (intent === 'filter' && !entities.categories && !entities.priority && !entities.dateRange) {
      return 'Please specify filter criteria (category, priority, or date)';
    }

    // Overall low confidence
    if (entities.confidence < this.config.minConfidenceThreshold) {
      return 'I\'m not confident I understood your request. Please try rephrasing.';
    }

    return undefined;
  }

  /**
   * Describe filters in human-readable format
   */
  private describeFilters(filters: any, context: { categories: Category[] }): string {
    const parts: string[] = [];

    if (filters.categories && filters.categories.length > 0) {
      const categoryNames = filters.categories
        .map((id: string) => context.categories.find(c => c.id === id)?.name)
        .filter(Boolean);
      parts.push(`Categories: ${categoryNames.join(', ')}`);
    }

    if (filters.priority) {
      parts.push(`Priority: ${filters.priority}`);
    }

    if (filters.dateRange) {
      if (filters.dateRange.start && filters.dateRange.end) {
        parts.push(`Date range: ${filters.dateRange.start.toLocaleDateString()} - ${filters.dateRange.end.toLocaleDateString()}`);
      } else if (filters.dateRange.end) {
        parts.push(`Due before: ${filters.dateRange.end.toLocaleDateString()}`);
      } else if (filters.dateRange.start) {
        parts.push(`Due after: ${filters.dateRange.start.toLocaleDateString()}`);
      }
    }

    return `Filter by ${parts.join(', ')}`;
  }
}

/**
 * Create a singleton instance
 */
export const nlpProcessor = new NLPProcessor();
