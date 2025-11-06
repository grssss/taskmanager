/**
 * Natural Language Processing Module
 * Export all NLP functionality
 */

export * from './types';
export * from './languagePatterns';
export * from './dateParser';
export * from './entityExtractor';
export * from './intentClassifier';
export * from './nlpProcessor';

// Re-export the singleton instance as default
export { nlpProcessor as default } from './nlpProcessor';
