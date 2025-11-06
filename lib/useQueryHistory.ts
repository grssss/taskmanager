/**
 * Query History Hook
 * Tracks and persists natural language query history for analytics
 */

import { useState, useCallback, useEffect } from 'react';
import { ProcessedQuery, QueryHistoryEntry } from './nlp/types';

const HISTORY_KEY = 'nlp-query-history';
const MAX_HISTORY_SIZE = 50;

export function useQueryHistory() {
  const [history, setHistory] = useState<QueryHistoryEntry[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const hydrated = parsed.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
          result: {
            ...entry.result,
            entities: {
              ...entry.result.entities,
              dueDate: entry.result.entities.dueDate
                ? new Date(entry.result.entities.dueDate)
                : undefined,
              dateRange: entry.result.entities.dateRange
                ? {
                    start: entry.result.entities.dateRange.start
                      ? new Date(entry.result.entities.dateRange.start)
                      : undefined,
                    end: entry.result.entities.dateRange.end
                      ? new Date(entry.result.entities.dateRange.end)
                      : undefined,
                  }
                : undefined,
            },
          },
        }));
        setHistory(hydrated);
      }
    } catch (error) {
      console.error('Error loading query history:', error);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (history.length === 0) return;

    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving query history:', error);
    }
  }, [history]);

  /**
   * Add a query to history
   */
  const addQuery = useCallback(
    (query: string, result: ProcessedQuery, wasSuccessful: boolean = true) => {
      const entry: QueryHistoryEntry = {
        id: `query-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        query,
        result,
        timestamp: new Date(),
        wasSuccessful,
      };

      setHistory((prev) => {
        const newHistory = [entry, ...prev];
        // Keep only the most recent entries
        return newHistory.slice(0, MAX_HISTORY_SIZE);
      });
    },
    []
  );

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(HISTORY_KEY);
    }
  }, []);

  /**
   * Get recent successful queries
   */
  const getRecentSuccessful = useCallback(
    (limit: number = 10) => {
      return history.filter((entry) => entry.wasSuccessful).slice(0, limit);
    },
    [history]
  );

  /**
   * Get query statistics
   */
  const getStats = useCallback(() => {
    const total = history.length;
    const successful = history.filter((e) => e.wasSuccessful).length;
    const failed = total - successful;

    // Intent distribution
    const intentCounts: Record<string, number> = {};
    history.forEach((entry) => {
      const intent = entry.result.intent;
      intentCounts[intent] = (intentCounts[intent] || 0) + 1;
    });

    // Average confidence
    const totalConfidence = history.reduce((sum, entry) => sum + entry.result.confidence, 0);
    const avgConfidence = total > 0 ? totalConfidence / total : 0;

    // Most common intents
    const sortedIntents = Object.entries(intentCounts).sort((a, b) => b[1] - a[1]);

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? successful / total : 0,
      avgConfidence,
      intentCounts,
      mostCommonIntent: sortedIntents[0]?.[0],
    };
  }, [history]);

  return {
    history,
    addQuery,
    clearHistory,
    getRecentSuccessful,
    getStats,
  };
}
