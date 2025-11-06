"use client";

/**
 * Natural Language Input Component
 * Main input interface for natural language queries
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Mic, X, Loader2, Sparkles } from 'lucide-react';
import { nlpProcessor, ProcessedQuery } from '../lib/nlp';
import type { Category, Column, Card } from '../lib/types';
import { QueryFeedback } from './QueryFeedback';
import { SuggestionsDropdown } from './SuggestionsDropdown';

interface NaturalLanguageInputProps {
  categories: Category[];
  columns: Column[];
  cards: Record<string, Card>;
  onQueryProcessed: (result: ProcessedQuery) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Adaptive placeholder texts that cycle through examples
 */
const placeholderExamples = [
  'Try: "Find high priority tasks"',
  'Try: "Create task: Fix login bug"',
  'Try: "Show tasks due this week"',
  'Try: "Filter by Design category"',
  'Try: "Add urgent task for tomorrow"',
  'Try: "Show all completed tasks"',
];

export function NaturalLanguageInput({
  categories,
  columns,
  cards,
  onQueryProcessed,
  placeholder,
  className = '',
}: NaturalLanguageInputProps) {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessedQuery | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(placeholderExamples[0]);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Rotate placeholder text
  useEffect(() => {
    if (!query && !placeholder) {
      const interval = setInterval(() => {
        setPlaceholderIndex((prev) => (prev + 1) % placeholderExamples.length);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [query, placeholder]);

  useEffect(() => {
    if (!placeholder) {
      setCurrentPlaceholder(placeholderExamples[placeholderIndex]);
    }
  }, [placeholderIndex, placeholder]);

  /**
   * Process query with debounce for real-time feedback
   */
  const processQuery = useCallback(
    (inputQuery: string) => {
      if (!inputQuery.trim()) {
        setResult(null);
        setShowSuggestions(false);
        return;
      }

      setIsProcessing(true);

      // Debounce processing
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        try {
          const processed = nlpProcessor.processQuery(inputQuery, {
            categories,
            columns,
            cards,
          });

          setResult(processed);
          setShowSuggestions(
            processed.confidence < 0.6 ||
            (processed.suggestions && processed.suggestions.length > 0) ||
            processed.requiresConfirmation
          );
          setIsProcessing(false);
        } catch (error) {
          console.error('Error processing query:', error);
          setIsProcessing(false);
        }
      }, 300);
    },
    [categories, columns, cards]
  );

  /**
   * Handle input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    processQuery(value);
  };

  /**
   * Handle query submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim() || !result) {
      return;
    }

    // Check for errors
    if (result.error) {
      return; // Errors are shown in QueryFeedback
    }

    // Execute the query
    onQueryProcessed(result);

    // Clear input after successful execution (optional)
    if (!result.requiresConfirmation) {
      setQuery('');
      setResult(null);
      setShowSuggestions(false);
    }
  };

  /**
   * Handle voice input (Web Speech API)
   */
  const handleVoiceInput = () => {
    // Check if browser supports speech recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice input is not supported in your browser. Please try Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = navigator.language || 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      processQuery(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  /**
   * Clear input
   */
  const handleClear = () => {
    setQuery('');
    setResult(null);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  /**
   * Apply a suggestion
   */
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    processQuery(suggestion);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          {/* Search Icon / Sparkles Icon */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {result && result.confidence > 0.7 ? (
              <Sparkles className="w-5 h-5 text-purple-500" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </div>

          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder={placeholder || currentPlaceholder}
            className="w-full pl-11 pr-24 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm"
            aria-label="Natural language query input"
          />

          {/* Right Side Controls */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {/* Processing Indicator */}
            {isProcessing && (
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            )}

            {/* Clear Button */}
            {query && !isProcessing && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                aria-label="Clear input"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}

            {/* Voice Input Button */}
            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={isListening}
              className={`p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors ${
                isListening ? 'bg-red-50 dark:bg-red-900/20' : ''
              }`}
              aria-label="Voice input"
              title="Voice input"
            >
              <Mic
                className={`w-4 h-4 ${
                  isListening ? 'text-red-500 animate-pulse' : 'text-gray-400'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Query Feedback */}
        {result && (
          <QueryFeedback
            result={result}
            onConfirm={() => onQueryProcessed(result)}
            onCancel={handleClear}
            className="mt-2"
          />
        )}
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && result && (
        <SuggestionsDropdown
          result={result}
          onSuggestionClick={handleSuggestionClick}
          onClose={() => setShowSuggestions(false)}
          className="mt-2"
        />
      )}

      {/* Quick Tips (shown when input is empty) */}
      {!query && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <Sparkles className="w-3 h-3" />
          <span>Try natural language: search, filter, create tasks, and more</span>
        </div>
      )}
    </div>
  );
}
