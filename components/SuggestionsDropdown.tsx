"use client";

/**
 * Suggestions Dropdown Component
 * Shows alternative interpretations and clarifications
 */

import { ProcessedQuery } from '../lib/nlp';
import { Lightbulb, AlertTriangle, ChevronRight, X } from 'lucide-react';

interface SuggestionsDropdownProps {
  result: ProcessedQuery;
  onSuggestionClick: (suggestion: string) => void;
  onClose: () => void;
  className?: string;
}

export function SuggestionsDropdown({
  result,
  onSuggestionClick,
  onClose,
  className = '',
}: SuggestionsDropdownProps) {
  const hasSuggestions = result.suggestions && result.suggestions.length > 0;
  const hasAmbiguities = result.entities.ambiguities && result.entities.ambiguities.length > 0;
  const hasAlternatives = result.alternatives && result.alternatives.length > 0;

  // Don't render if there's nothing to show
  if (!hasSuggestions && !hasAmbiguities && !hasAlternatives) {
    return null;
  }

  /**
   * Generate example queries for alternative intents
   */
  const getExampleQuery = (intent: string): string => {
    const examples: Record<string, string> = {
      search: 'find tasks about login',
      filter: 'show high priority tasks',
      create: 'create task: Fix navigation bug',
      modify: 'update task priority to high',
      delete: 'delete completed tasks',
      navigate: 'go to project dashboard',
      clear: 'show all tasks',
    };
    return examples[intent] || intent;
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute top-0 left-0 right-0 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Suggestions
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            aria-label="Close suggestions"
          >
            <X className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto">
          {/* Ambiguities / Warnings */}
          {hasAmbiguities && (
            <div className="p-2 space-y-1">
              <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-orange-700 dark:text-orange-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Clarifications needed</span>
              </div>
              {result.entities.ambiguities!.map((ambiguity, index) => (
                <div
                  key={index}
                  className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-100 dark:border-orange-900/40"
                >
                  {ambiguity}
                </div>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {hasSuggestions && (
            <div className="p-2 space-y-1">
              {result.suggestions!.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSuggestionClick(suggestion)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors group"
                >
                  <span className="text-gray-700 dark:text-gray-300">{suggestion}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          )}

          {/* Alternative intents */}
          {hasAlternatives && result.confidence < 0.7 && (
            <div className="p-2 space-y-1 border-t border-gray-200 dark:border-gray-700">
              <div className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                Did you mean to...
              </div>
              {result.alternatives!.slice(0, 3).map((altIntent, index) => {
                const example = getExampleQuery(altIntent);
                return (
                  <button
                    key={index}
                    onClick={() => onSuggestionClick(example)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors group"
                  >
                    <div>
                      <div className="text-gray-700 dark:text-gray-300 font-medium capitalize">
                        {altIntent}
                      </div>
                      <div className="text-gray-500 dark:text-gray-500 mt-0.5">
                        Example: "{example}"
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Help text */}
          <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-500 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
            <div className="font-medium mb-1">Quick tips:</div>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>Use quotes for exact names: "Design" category</li>
              <li>Specify dates: "due tomorrow" or "by Friday"</li>
              <li>Combine filters: "high priority in Development"</li>
              <li>Create with details: "create urgent task: Fix bug"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
