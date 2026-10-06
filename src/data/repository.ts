import { Preferences } from '@capacitor/preferences';
import type { Database } from '../domain/models';
import { initialDatabase } from './seed';
export interface BarrioRepository {
  load(): Promise<Database>;
  save(database: Database): Promise<void>;
}
const KEY = 'barriored.database.v1';
// Replace this adapter with an authenticated API repository without changing the views.
export class LocalBarrioRepository implements BarrioRepository {
  async load(): Promise<Database> {
    const { value } = await Preferences.get({ key: KEY });
    if (!value) return initialDatabase();
    const parsed = JSON.parse(value) as Database;
    if (
      parsed.version !== 1 ||
      !parsed.profile ||
      !Array.isArray(parsed.requests) ||
      !Array.isArray(parsed.reviews) ||
      !Array.isArray(parsed.favorites)
    ) {
      throw new Error('Los datos locales no son compatibles. No se sobrescribieron.');
    }
    return parsed;
  }
  async save(database: Database): Promise<void> {
    await Preferences.set({ key: KEY, value: JSON.stringify(database) });
  }
}
