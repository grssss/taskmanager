"use client";

/**
 * Query Feedback Component
 * Shows real-time interpretation of user's query
 */

import { ProcessedQuery } from '../lib/nlp';
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Navigation,
  X,
  Check,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

interface QueryFeedbackProps {
  result: ProcessedQuery;
  onConfirm?: () => void;
  onCancel?: () => void;
  className?: string;
}

/**
 * Get icon for intent type
 */
function getIntentIcon(intent: string) {
  switch (intent) {
    case 'search':
      return Search;
    case 'filter':
      return Filter;
    case 'create':
      return Plus;
    case 'modify':
      return Edit;
    case 'delete':
      return Trash2;
    case 'navigate':
      return Navigation;
    case 'clear':
      return X;
    default:
      return Info;
  }
}

/**
 * Get color classes for intent
 */
function getIntentColor(intent: string, confidence: number) {
  if (confidence < 0.5) {
    return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
  }

  switch (intent) {
    case 'search':
      return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    case 'filter':
      return 'text-purple-500 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
    case 'create':
      return 'text-green-500 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    case 'modify':
      return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    case 'delete':
      return 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    case 'navigate':
      return 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800';
    case 'clear':
      return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    default:
      return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
  }
}

/**
 * Format confidence as percentage
 */
function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

export function QueryFeedback({
  result,
  onConfirm,
  onCancel,
  className = ''
}: QueryFeedbackProps) {
  const Icon = getIntentIcon(result.intent);
  const colorClasses = getIntentColor(result.intent, result.confidence);

  // Show error state
  if (result.error) {
    return (
      <div className={`p-3 rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 ${className}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              Unable to process query
            </p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-1">
              {result.error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show unknown intent
  if (result.intent === 'unknown') {
    return (
      <div className={`p-3 rounded-lg border bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800 ${className}`}>
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-400">
              I'm not sure what you want to do
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-500 mt-1">
              Try being more specific, like "find high priority tasks" or "create task: Fix bug"
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border ${colorClasses} ${className}`}>
      <div className="p-3">
        {/* Header with intent and confidence */}
        <div className="flex items-start gap-3">
          <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />

          <div className="flex-1 min-w-0">
            {/* Intent description */}
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium">
                {result.feedback}
              </p>
              <span className="text-xs opacity-75">
                ({formatConfidence(result.confidence)} confident)
              </span>
            </div>

            {/* Extracted information */}
            {result.actions.length > 0 && (
              <div className="space-y-1 mt-2">
                {result.actions.map((action, index) => (
                  <div key={index} className="text-xs opacity-90">
                    <span className="font-medium">{action.type}:</span>{' '}
                    <span>{action.description}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Entity details */}
            {result.entities && (
              <div className="mt-2 flex flex-wrap gap-2">
                {result.entities.priority && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/50 dark:bg-black/20">
                    Priority: {result.entities.priority}
                  </span>
                )}
                {result.entities.categories && result.entities.categories.length > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/50 dark:bg-black/20">
                    Categories: {result.entities.categories.join(', ')}
                  </span>
                )}
                {result.entities.dueDate && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/50 dark:bg-black/20">
                    Due: {result.entities.dueDate.toLocaleDateString()}
                  </span>
                )}
                {result.entities.keywords && result.entities.keywords.length > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/50 dark:bg-black/20">
                    Keywords: {result.entities.keywords.slice(0, 3).join(', ')}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Confidence indicator */}
          <div className="flex-shrink-0">
            {result.confidence >= 0.7 ? (
              <CheckCircle className="w-4 h-4 opacity-75" />
            ) : result.confidence >= 0.5 ? (
              <Info className="w-4 h-4 opacity-75" />
            ) : (
              <AlertCircle className="w-4 h-4 opacity-75" />
            )}
          </div>
        </div>

        {/* Confirmation buttons for high-risk actions */}
        {result.requiresConfirmation && onConfirm && onCancel && (
          <div className="mt-3 flex items-center gap-2 pt-3 border-t border-current/20">
            <button
              type="button"
              onClick={onConfirm}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/80 dark:bg-black/40 hover:bg-white dark:hover:bg-black/60 rounded-md transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Confirm
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/80 dark:bg-black/40 hover:bg-white dark:hover:bg-black/60 rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
