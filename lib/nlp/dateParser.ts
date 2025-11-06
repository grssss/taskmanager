/**
 * Natural Language Date Parser
 * Parses human-friendly date expressions into Date objects
 */

import { dateKeywords } from './languagePatterns';

/**
 * Parse natural language date expressions
 */
export function parseNaturalDate(text: string, language: 'en' | 'es' | 'fr' | 'de' = 'en'): Date | null {
  const lowerText = text.toLowerCase().trim();
  const now = new Date();

  // Today
  if (matchesKeywords(lowerText, dateKeywords.today, language)) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  // Tomorrow
  if (matchesKeywords(lowerText, dateKeywords.tomorrow, language)) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
  }

  // Yesterday
  if (matchesKeywords(lowerText, dateKeywords.yesterday, language)) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
  }

  // Next week
  if (lowerText.match(/next\s+week|próxima\s+semana|semaine\s+prochaine|nächste\s+woche/)) {
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate());
  }

  // Next month
  if (lowerText.match(/next\s+month|próximo\s+mes|mois\s+prochain|nächsten\s+monat/)) {
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), nextMonth.getDate());
  }

  // In X days
  const daysMatch = lowerText.match(/in\s+(\d+)\s+days?|en\s+(\d+)\s+días?|dans\s+(\d+)\s+jours?|in\s+(\d+)\s+tagen?/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1] || daysMatch[2] || daysMatch[3] || daysMatch[4]);
    const future = new Date(now);
    future.setDate(future.getDate() + days);
    return new Date(future.getFullYear(), future.getMonth(), future.getDate());
  }

  // In X weeks
  const weeksMatch = lowerText.match(/in\s+(\d+)\s+weeks?|en\s+(\d+)\s+semanas?|dans\s+(\d+)\s+semaines?|in\s+(\d+)\s+wochen?/);
  if (weeksMatch) {
    const weeks = parseInt(weeksMatch[1] || weeksMatch[2] || weeksMatch[3] || weeksMatch[4]);
    const future = new Date(now);
    future.setDate(future.getDate() + (weeks * 7));
    return new Date(future.getFullYear(), future.getMonth(), future.getDate());
  }

  // Day of week (next Monday, etc.)
  const dayNames = {
    en: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    es: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
    fr: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
    de: ['sonntag', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag'],
  };

  for (let i = 0; i < 7; i++) {
    const dayName = dayNames[language][i];
    if (lowerText.includes(dayName)) {
      const currentDay = now.getDay();
      const targetDay = i;
      let daysUntil = targetDay - currentDay;

      // If the day has passed this week, go to next week
      if (daysUntil <= 0) {
        daysUntil += 7;
      }

      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + daysUntil);
      return new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    }
  }

  // Standard date formats
  // ISO format: YYYY-MM-DD
  const isoMatch = lowerText.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // Common formats: MM/DD/YYYY, DD/MM/YYYY, DD.MM.YYYY
  const dateMatch = lowerText.match(/(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{2,4})/);
  if (dateMatch) {
    const [, first, second, year] = dateMatch;
    const fullYear = year.length === 2 ? 2000 + parseInt(year) : parseInt(year);

    // Try both interpretations based on language
    if (language === 'en') {
      // MM/DD/YYYY
      return new Date(fullYear, parseInt(first) - 1, parseInt(second));
    } else {
      // DD/MM/YYYY (European format)
      return new Date(fullYear, parseInt(second) - 1, parseInt(first));
    }
  }

  // Month names
  const months = {
    en: ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'],
    es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
    fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
    de: ['januar', 'februar', 'märz', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'dezember'],
  };

  for (let i = 0; i < 12; i++) {
    const monthName = months[language][i];
    if (lowerText.includes(monthName)) {
      // Try to find day number near the month name
      const dayMatch = lowerText.match(new RegExp(`(\\d{1,2})(?:st|nd|rd|th)?\\s+${monthName}|${monthName}\\s+(\\d{1,2})`));
      if (dayMatch) {
        const day = parseInt(dayMatch[1] || dayMatch[2]);
        const year = now.getFullYear();
        const date = new Date(year, i, day);

        // If the date is in the past, assume next year
        if (date < now) {
          date.setFullYear(year + 1);
        }

        return date;
      }
    }
  }

  return null;
}

/**
 * Parse date range expressions
 */
export function parseDateRange(text: string, language: 'en' | 'es' | 'fr' | 'de' = 'en'): { start?: Date; end?: Date } | null {
  const lowerText = text.toLowerCase();

  // This week
  if (lowerText.match(/this\s+week|esta\s+semana|cette\s+semaine|diese\s+woche/)) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return {
      start: new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate()),
      end: new Date(endOfWeek.getFullYear(), endOfWeek.getMonth(), endOfWeek.getDate()),
    };
  }

  // This month
  if (lowerText.match(/this\s+month|este\s+mes|ce\s+mois|dieser\s+monat/)) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      start: startOfMonth,
      end: endOfMonth,
    };
  }

  // Overdue
  if (lowerText.match(/overdue|vencido|en retard|überfällig/)) {
    return {
      end: new Date(),
    };
  }

  // Due soon (next 3 days)
  if (lowerText.match(/soon|pronto|bientôt|bald/)) {
    const now = new Date();
    const threeDays = new Date(now);
    threeDays.setDate(threeDays.getDate() + 3);

    return {
      start: now,
      end: threeDays,
    };
  }

  return null;
}

/**
 * Extract all date mentions from text
 */
export function extractDates(text: string, language: 'en' | 'es' | 'fr' | 'de' = 'en'): Date[] {
  const dates: Date[] = [];
  const segments = text.split(/[,;]/).map(s => s.trim());

  for (const segment of segments) {
    const date = parseNaturalDate(segment, language);
    if (date) {
      dates.push(date);
    }
  }

  return dates;
}

/**
 * Helper to match keywords
 */
function matchesKeywords(text: string, keywordSet: any, language: string): boolean {
  const keywords = keywordSet[language] || [];
  return keywords.some((keyword: string) => text.includes(keyword));
}

/**
 * Format date for human reading
 */
export function formatNaturalDate(date: Date, language: 'en' | 'es' | 'fr' | 'de' = 'en'): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const labels = {
    today: { en: 'Today', es: 'Hoy', fr: 'Aujourd\'hui', de: 'Heute' },
    tomorrow: { en: 'Tomorrow', es: 'Mañana', fr: 'Demain', de: 'Morgen' },
    yesterday: { en: 'Yesterday', es: 'Ayer', fr: 'Hier', de: 'Gestern' },
  };

  if (dateOnly.getTime() === today.getTime()) {
    return labels.today[language];
  }
  if (dateOnly.getTime() === tomorrow.getTime()) {
    return labels.tomorrow[language];
  }
  if (dateOnly.getTime() === yesterday.getTime()) {
    return labels.yesterday[language];
  }

  // Default formatting
  return date.toLocaleDateString(language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : language === 'fr' ? 'fr-FR' : 'de-DE');
}
