/**
 * Service for managing seed history in localStorage
 */

import { logger } from './LoggerService';
import type { SeedHistoryEntry } from '../types';

export class SeedHistoryService {
  private readonly STORAGE_KEY = 'lazy-map-seed-history';
  private readonly MAX_ENTRIES = 20;

  /**
   * Save a new seed entry to history
   */
  saveEntry(entry: Omit<SeedHistoryEntry, 'id' | 'timestamp'>): SeedHistoryEntry {
    const newEntry: SeedHistoryEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: new Date().toISOString()
    };

    const history = this.getHistory();
    
    // Remove duplicate seeds (same seed value)
    const filteredHistory = history.filter(
      existing => String(existing.seed) !== String(newEntry.seed)
    );

    // Add new entry at the beginning
    const updatedHistory = [newEntry, ...filteredHistory];

    // Limit to max entries
    const trimmedHistory = updatedHistory.slice(0, this.MAX_ENTRIES);

    this.saveToStorage(trimmedHistory);
    return newEntry;
  }

  /**
   * Get all seed history entries
   */
  getHistory(): SeedHistoryEntry[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];

      return parsed.filter(this.isValidEntry);
    } catch (error) {
      logger.warn('Failed to load seed history', { component: 'SeedHistoryService', operation: 'getHistory' }, { error });
      return [];
    }
  }

  /**
   * Get recent successful seeds
   */
  getRecentSeeds(limit: number = 10): SeedHistoryEntry[] {
    return this.getHistory()
      .filter(entry => entry.generationSuccess)
      .slice(0, limit);
  }

  /**
   * Remove a specific entry by ID
   */
  removeEntry(id: string): void {
    const history = this.getHistory();
    const updatedHistory = history.filter(entry => entry.id !== id);
    this.saveToStorage(updatedHistory);
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Check if a seed already exists in history
   */
  seedExists(seed: string | number): boolean {
    const history = this.getHistory();
    return history.some(entry => String(entry.seed) === String(seed));
  }

  /**
   * Get entry by seed value
   */
  getEntryBySeed(seed: string | number): SeedHistoryEntry | undefined {
    const history = this.getHistory();
    return history.find(entry => String(entry.seed) === String(seed));
  }

  /**
   * Get formatted display text for an entry
   */
  getDisplayText(entry: SeedHistoryEntry): string {
    const timeAgo = this.getTimeAgo(entry.timestamp);
    const seedText = typeof entry.seed === 'string' ? `"${entry.seed}"` : entry.seed;
    return `${entry.mapName} (${seedText}) - ${timeAgo}`;
  }

  private generateId(): string {
    return `seed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveToStorage(history: SeedHistoryEntry[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      logger.warn('Failed to save seed history', { component: 'SeedHistoryService', operation: 'saveToStorage' }, { error });
    }
  }

  private isValidEntry(entry: any): entry is SeedHistoryEntry {
    return (
      typeof entry === 'object' &&
      entry !== null &&
      typeof entry.id === 'string' &&
      (typeof entry.seed === 'string' || typeof entry.seed === 'number') &&
      typeof entry.mapName === 'string' &&
      typeof entry.timestamp === 'string' &&
      typeof entry.generationSuccess === 'boolean'
    );
  }

  private getTimeAgo(timestamp: string): string {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return past.toLocaleDateString();
  }
}

// Export singleton instance
export const seedHistoryService = new SeedHistoryService();