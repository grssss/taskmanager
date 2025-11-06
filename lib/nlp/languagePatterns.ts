/**
 * Multi-language keyword patterns for intent recognition
 * Supports: English (en), Spanish (es), French (fr), German (de)
 */

import { LanguageKeywords } from './types';

/**
 * Keywords for each intent type across supported languages
 */
export const intentKeywords: LanguageKeywords = {
  // Search/Find operations
  search: {
    en: ['find', 'search', 'look', 'show', 'display', 'get', 'list', 'where'],
    es: ['buscar', 'encontrar', 'mostrar', 'ver', 'listar', 'dónde'],
    fr: ['chercher', 'trouver', 'rechercher', 'montrer', 'afficher', 'lister', 'où'],
    de: ['suchen', 'finden', 'zeigen', 'anzeigen', 'auflisten', 'wo'],
  },

  // Filter operations
  filter: {
    en: ['filter', 'only', 'with', 'by', 'category', 'priority', 'due'],
    es: ['filtrar', 'solo', 'con', 'por', 'categoría', 'prioridad', 'vencimiento'],
    fr: ['filtrer', 'seulement', 'avec', 'par', 'catégorie', 'priorité', 'échéance'],
    de: ['filtern', 'nur', 'mit', 'nach', 'kategorie', 'priorität', 'fällig'],
  },

  // Create operations
  create: {
    en: ['create', 'add', 'new', 'make', 'insert', 'task', 'todo'],
    es: ['crear', 'añadir', 'nuevo', 'hacer', 'insertar', 'tarea'],
    fr: ['créer', 'ajouter', 'nouveau', 'faire', 'insérer', 'tâche'],
    de: ['erstellen', 'hinzufügen', 'neu', 'machen', 'einfügen', 'aufgabe'],
  },

  // Modify operations
  modify: {
    en: ['update', 'edit', 'change', 'modify', 'move', 'rename', 'set'],
    es: ['actualizar', 'editar', 'cambiar', 'modificar', 'mover', 'renombrar'],
    fr: ['mettre à jour', 'modifier', 'changer', 'déplacer', 'renommer'],
    de: ['aktualisieren', 'bearbeiten', 'ändern', 'verschieben', 'umbenennen'],
  },

  // Delete operations
  delete: {
    en: ['delete', 'remove', 'clear', 'erase', 'drop'],
    es: ['eliminar', 'borrar', 'quitar', 'suprimir'],
    fr: ['supprimer', 'effacer', 'retirer', 'enlever'],
    de: ['löschen', 'entfernen', 'leeren'],
  },

  // Navigate operations
  navigate: {
    en: ['go', 'open', 'switch', 'navigate', 'view'],
    es: ['ir', 'abrir', 'cambiar', 'navegar', 'ver'],
    fr: ['aller', 'ouvrir', 'changer', 'naviguer', 'voir'],
    de: ['gehen', 'öffnen', 'wechseln', 'navigieren', 'ansicht'],
  },
};

/**
 * Priority level keywords
 */
export const priorityKeywords: LanguageKeywords = {
  low: {
    en: ['low', 'minor', 'trivial'],
    es: ['baja', 'bajo', 'menor', 'trivial'],
    fr: ['faible', 'bas', 'mineur', 'trivial'],
    de: ['niedrig', 'gering', 'unwichtig'],
  },
  medium: {
    en: ['medium', 'normal', 'moderate'],
    es: ['media', 'medio', 'normal', 'moderada'],
    fr: ['moyen', 'moyenne', 'normal', 'modéré'],
    de: ['mittel', 'normal', 'mäßig'],
  },
  high: {
    en: ['high', 'important', 'urgent'],
    es: ['alta', 'alto', 'importante', 'urgente'],
    fr: ['haut', 'haute', 'important', 'urgent'],
    de: ['hoch', 'wichtig', 'dringend'],
  },
  critical: {
    en: ['critical', 'blocker', 'emergency', 'asap'],
    es: ['crítica', 'crítico', 'bloqueante', 'emergencia'],
    fr: ['critique', 'bloquant', 'urgence'],
    de: ['kritisch', 'blocker', 'notfall', 'sofort'],
  },
};

/**
 * Date/time keywords for natural date parsing
 */
export const dateKeywords: LanguageKeywords = {
  today: {
    en: ['today', 'now'],
    es: ['hoy', 'ahora'],
    fr: ['aujourd\'hui', 'maintenant'],
    de: ['heute', 'jetzt'],
  },
  tomorrow: {
    en: ['tomorrow'],
    es: ['mañana'],
    fr: ['demain'],
    de: ['morgen'],
  },
  yesterday: {
    en: ['yesterday'],
    es: ['ayer'],
    fr: ['hier'],
    de: ['gestern'],
  },
  week: {
    en: ['week', 'weekly'],
    es: ['semana', 'semanal'],
    fr: ['semaine', 'hebdomadaire'],
    de: ['woche', 'wöchentlich'],
  },
  month: {
    en: ['month', 'monthly'],
    es: ['mes', 'mensual'],
    fr: ['mois', 'mensuel'],
    de: ['monat', 'monatlich'],
  },
};

/**
 * Stopwords to filter out (common words with little meaning)
 */
export const stopwords = {
  en: ['a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must', 'shall', 'to', 'of', 'in', 'for', 'on', 'at', 'by', 'with', 'from', 'as', 'that', 'this', 'these', 'those', 'and', 'or', 'but', 'if', 'then', 'than', 'so', 'me', 'my', 'mine', 'i', 'you', 'your', 'it', 'its'],
  es: ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'es', 'son', 'de', 'del', 'en', 'por', 'para', 'con', 'sin', 'sobre', 'y', 'o', 'pero', 'que', 'este', 'ese', 'aquel', 'mi', 'tu', 'su'],
  fr: ['le', 'la', 'les', 'un', 'une', 'des', 'est', 'sont', 'de', 'du', 'dans', 'pour', 'par', 'avec', 'sans', 'sur', 'et', 'ou', 'mais', 'que', 'ce', 'cette', 'mon', 'ton', 'son'],
  de: ['der', 'die', 'das', 'den', 'dem', 'ein', 'eine', 'einen', 'einem', 'ist', 'sind', 'von', 'in', 'für', 'mit', 'auf', 'an', 'zu', 'und', 'oder', 'aber', 'dass', 'dies', 'mein', 'dein', 'sein'],
};

/**
 * Common task-related objects
 */
export const taskObjects: LanguageKeywords = {
  task: {
    en: ['task', 'tasks', 'todo', 'todos', 'item', 'items'],
    es: ['tarea', 'tareas', 'elemento', 'elementos'],
    fr: ['tâche', 'tâches', 'élément', 'éléments'],
    de: ['aufgabe', 'aufgaben', 'element', 'elemente'],
  },
  column: {
    en: ['column', 'status', 'state', 'stage'],
    es: ['columna', 'estado', 'etapa'],
    fr: ['colonne', 'statut', 'état', 'étape'],
    de: ['spalte', 'status', 'zustand', 'phase'],
  },
  category: {
    en: ['category', 'categories', 'tag', 'tags', 'label', 'labels'],
    es: ['categoría', 'categorías', 'etiqueta', 'etiquetas'],
    fr: ['catégorie', 'catégories', 'étiquette', 'étiquettes'],
    de: ['kategorie', 'kategorien', 'tag', 'tags', 'etikett'],
  },
  project: {
    en: ['project', 'projects', 'board', 'boards'],
    es: ['proyecto', 'proyectos', 'tablero', 'tableros'],
    fr: ['projet', 'projets', 'tableau', 'tableaux'],
    de: ['projekt', 'projekte', 'board', 'boards'],
  },
};

/**
 * Detect language from query text
 */
export function detectLanguage(query: string): 'en' | 'es' | 'fr' | 'de' {
  const lowerQuery = query.toLowerCase();
  const scores = { en: 0, es: 0, fr: 0, de: 0 };

  // Check against all keyword sets
  const allKeywords = { ...intentKeywords, ...priorityKeywords, ...dateKeywords, ...taskObjects };

  for (const keywordSet of Object.values(allKeywords)) {
    for (const [lang, words] of Object.entries(keywordSet)) {
      if (lang in scores) {
        for (const word of words) {
          if (lowerQuery.includes(word)) {
            scores[lang as keyof typeof scores]++;
          }
        }
      }
    }
  }

  // Return language with highest score, default to English
  const detectedLang = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0] as 'en' | 'es' | 'fr' | 'de';
  return scores[detectedLang] > 0 ? detectedLang : 'en';
}

/**
 * Get keywords for a specific concept in a given language
 */
export function getKeywords(concept: string, language: 'en' | 'es' | 'fr' | 'de'): string[] {
  const allKeywords = { ...intentKeywords, ...priorityKeywords, ...dateKeywords, ...taskObjects };
  return allKeywords[concept]?.[language] || [];
}
