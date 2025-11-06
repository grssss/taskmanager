/**
 * Intent Classification
 * Determines user intent from natural language queries
 */

import { IntentType, IntentPattern } from './types';
import { intentKeywords } from './languagePatterns';

/**
 * Intent classification patterns with weights
 * Higher weight = more specific/preferred match
 */
export const intentPatterns: IntentPattern[] = [
  // SEARCH intents
  {
    intent: 'search',
    patterns: [
      /\b(find|search|look|show|display|get|list|where)\b.*(task|todo|item)/i,
      /\b(buscar|encontrar|mostrar|ver|listar)\b.*(tarea)/i,
      /\b(chercher|trouver|rechercher|montrer|afficher)\b.*(tâche)/i,
      /\b(suchen|finden|zeigen|anzeigen)\b.*(aufgabe)/i,
    ],
    weight: 8,
    languages: ['en', 'es', 'fr', 'de'],
  },
  {
    intent: 'search',
    patterns: [
      /\bwhere\s+(is|are)\b/i,
      /\bdónde\s+(está|están)\b/i,
      /\boù\s+(est|sont)\b/i,
      /\bwo\s+(ist|sind)\b/i,
    ],
    weight: 9,
  },

  // FILTER intents
  {
    intent: 'filter',
    patterns: [
      /\b(filter|show only|only show|display only)\b/i,
      /\b(filtrar|mostrar solo|solo mostrar)\b/i,
      /\b(filtrer|afficher seulement|seulement afficher)\b/i,
      /\b(filtern|nur zeigen|zeigen nur)\b/i,
    ],
    weight: 10,
  },
  {
    intent: 'filter',
    patterns: [
      /\b(high|critical)\s+(priority|tasks?)/i,
      /\b(alta|crítica)\s+(prioridad|tareas?)/i,
      /\b(haute|critique)\s+(priorité|tâches?)/i,
      /\b(hoch|kritisch)\s+(priorität|aufgaben?)/i,
    ],
    weight: 9,
  },
  {
    intent: 'filter',
    patterns: [
      /\bby\s+(category|priority|due date)/i,
      /\bpor\s+(categoría|prioridad|fecha)/i,
      /\bpar\s+(catégorie|priorité|date)/i,
      /\bnach\s+(kategorie|priorität|datum)/i,
    ],
    weight: 8,
  },

  // CLEAR intents
  {
    intent: 'clear',
    patterns: [
      /\b(clear|remove|reset)\s+(all\s+)?(filter|filters)/i,
      /\b(limpiar|eliminar|restablecer)\s+(filtros?)/i,
      /\b(effacer|supprimer|réinitialiser)\s+(filtres?)/i,
      /\b(löschen|entfernen|zurücksetzen)\s+(filter)/i,
    ],
    weight: 10,
  },
  {
    intent: 'clear',
    patterns: [
      /\bshow\s+(all|everything)/i,
      /\bmostrar\s+(todo|todos)/i,
      /\bafficher\s+(tout|tous)/i,
      /\bzeigen\s+(alles|alle)/i,
    ],
    weight: 7,
  },

  // CREATE intents
  {
    intent: 'create',
    patterns: [
      /\b(create|add|new|make|insert)\s+(a\s+)?(task|todo|item)/i,
      /\b(crear|añadir|nuevo|hacer|insertar)\s+(una?\s+)?(tarea)/i,
      /\b(créer|ajouter|nouveau|faire|insérer)\s+(une?\s+)?(tâche)/i,
      /\b(erstellen|hinzufügen|neu|machen|einfügen)\s+(eine?\s+)?(aufgabe)/i,
    ],
    weight: 10,
  },
  {
    intent: 'create',
    patterns: [
      /^(create|add|new)\b/i,
      /^(crear|añadir|nuevo)\b/i,
      /^(créer|ajouter|nouveau)\b/i,
      /^(erstellen|hinzufügen|neu)\b/i,
    ],
    weight: 8,
  },

  // MODIFY intents
  {
    intent: 'modify',
    patterns: [
      /\b(update|edit|change|modify|move|rename)\b/i,
      /\b(actualizar|editar|cambiar|modificar|mover)\b/i,
      /\b(mettre à jour|modifier|changer|déplacer)\b/i,
      /\b(aktualisieren|bearbeiten|ändern|verschieben)\b/i,
    ],
    weight: 8,
  },
  {
    intent: 'modify',
    patterns: [
      /\bset\s+(priority|category|due date|status)/i,
      /\bestablece\s+(prioridad|categoría|fecha|estado)/i,
      /\bdéfinir\s+(priorité|catégorie|date|statut)/i,
      /\bsetzen\s+(priorität|kategorie|datum|status)/i,
    ],
    weight: 9,
  },

  // DELETE intents
  {
    intent: 'delete',
    patterns: [
      /\b(delete|remove|erase|drop)\s+(task|todo|item)/i,
      /\b(eliminar|borrar|quitar|suprimir)\s+(tarea)/i,
      /\b(supprimer|effacer|retirer|enlever)\s+(tâche)/i,
      /\b(löschen|entfernen)\s+(aufgabe)/i,
    ],
    weight: 10,
  },

  // NAVIGATE intents
  {
    intent: 'navigate',
    patterns: [
      /\b(go to|open|switch to|navigate to|view)\s+(project|board|column)/i,
      /\b(ir a|abrir|cambiar a|navegar a|ver)\s+(proyecto|tablero|columna)/i,
      /\b(aller à|ouvrir|changer vers|naviguer vers|voir)\s+(projet|tableau|colonne)/i,
      /\b(gehen zu|öffnen|wechseln zu|navigieren zu)\s+(projekt|board|spalte)/i,
    ],
    weight: 9,
  },
];

/**
 * Classify intent from query
 */
export function classifyIntent(query: string, language: 'en' | 'es' | 'fr' | 'de' = 'en'): {
  intent: IntentType;
  confidence: number;
  alternatives: Array<{ intent: IntentType; confidence: number }>;
} {
  const lowerQuery = query.toLowerCase().trim();
  const scores: Map<IntentType, number> = new Map();

  // Check each pattern
  for (const pattern of intentPatterns) {
    // Skip if pattern doesn't support this language
    if (pattern.languages && !pattern.languages.includes(language)) {
      continue;
    }

    for (const regex of pattern.patterns) {
      if (regex.test(lowerQuery)) {
        const currentScore = scores.get(pattern.intent) || 0;
        scores.set(pattern.intent, currentScore + pattern.weight);
      }
    }

    // Check required keywords
    if (pattern.requiredKeywords) {
      const hasRequired = pattern.requiredKeywords.some(kw =>
        lowerQuery.includes(kw.toLowerCase())
      );
      if (hasRequired) {
        const currentScore = scores.get(pattern.intent) || 0;
        scores.set(pattern.intent, currentScore + pattern.weight * 0.5);
      }
    }

    // Check exclude keywords
    if (pattern.excludeKeywords) {
      const hasExcluded = pattern.excludeKeywords.some(kw =>
        lowerQuery.includes(kw.toLowerCase())
      );
      if (hasExcluded) {
        scores.delete(pattern.intent);
      }
    }
  }

  // Check for intent keywords
  for (const [intentKey, keywords] of Object.entries(intentKeywords)) {
    const intentWords = keywords[language] || [];
    for (const word of intentWords) {
      if (lowerQuery.includes(word)) {
        const intent = intentKey as IntentType;
        const currentScore = scores.get(intent) || 0;
        scores.set(intent, currentScore + 3);
      }
    }
  }

  // Sort by score
  const sortedScores = Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1]);

  if (sortedScores.length === 0) {
    return {
      intent: 'unknown',
      confidence: 0,
      alternatives: [],
    };
  }

  // Calculate confidence (normalize to 0-1)
  const maxScore = sortedScores[0][1];
  const confidence = Math.min(maxScore / 15, 1); // 15 is a high score threshold

  // Get alternatives
  const alternatives = sortedScores.slice(1, 4).map(([intent, score]) => ({
    intent,
    confidence: Math.min(score / 15, 1),
  }));

  return {
    intent: sortedScores[0][0],
    confidence,
    alternatives,
  };
}

/**
 * Generate human-readable feedback for the classified intent
 */
export function generateIntentFeedback(
  intent: IntentType,
  query: string,
  language: 'en' | 'es' | 'fr' | 'de' = 'en'
): string {
  const feedback = {
    search: {
      en: 'Searching for tasks matching your query...',
      es: 'Buscando tareas que coincidan con tu consulta...',
      fr: 'Recherche de tâches correspondant à votre requête...',
      de: 'Suche nach Aufgaben, die Ihrer Anfrage entsprechen...',
    },
    filter: {
      en: 'Filtering tasks based on your criteria...',
      es: 'Filtrando tareas según tus criterios...',
      fr: 'Filtrage des tâches selon vos critères...',
      de: 'Filtern von Aufgaben nach Ihren Kriterien...',
    },
    create: {
      en: 'Preparing to create a new task...',
      es: 'Preparando para crear una nueva tarea...',
      fr: 'Préparation de la création d\'une nouvelle tâche...',
      de: 'Vorbereitung zum Erstellen einer neuen Aufgabe...',
    },
    modify: {
      en: 'Looking for tasks to modify...',
      es: 'Buscando tareas para modificar...',
      fr: 'Recherche de tâches à modifier...',
      de: 'Suche nach zu ändernden Aufgaben...',
    },
    delete: {
      en: 'Looking for tasks to delete...',
      es: 'Buscando tareas para eliminar...',
      fr: 'Recherche de tâches à supprimer...',
      de: 'Suche nach zu löschenden Aufgaben...',
    },
    navigate: {
      en: 'Navigating to the requested view...',
      es: 'Navegando a la vista solicitada...',
      fr: 'Navigation vers la vue demandée...',
      de: 'Navigation zur angeforderten Ansicht...',
    },
    clear: {
      en: 'Clearing all filters...',
      es: 'Limpiando todos los filtros...',
      fr: 'Effacement de tous les filtres...',
      de: 'Löschen aller Filter...',
    },
    unknown: {
      en: 'I\'m not sure what you want to do. Try being more specific.',
      es: 'No estoy seguro de lo que quieres hacer. Intenta ser más específico.',
      fr: 'Je ne suis pas sûr de ce que vous voulez faire. Essayez d\'être plus précis.',
      de: 'Ich bin mir nicht sicher, was Sie tun möchten. Versuchen Sie, spezifischer zu sein.',
    },
  };

  return feedback[intent][language];
}
