import type { KeyStatus } from '../types';

const KEY_INDEX_STORAGE = 'lada_current_key_idx_v1';
const COOLDOWNS_STORAGE = 'lada_key_cooldowns_v1';

export class KeyManager {
  private keys: string[] = [];
  private currentIndex: number = 0;
  private cooldowns: Record<number, number> = {}; // key index -> timestamp ms

  constructor(keys: string[]) {
    this.keys = keys;
    this.loadState();
  }

  public updateKeys(keys: string[]): void {
    this.keys = keys;
    if (this.currentIndex >= this.keys.length) {
      this.currentIndex = 0;
    }
    this.saveState();
  }

  private loadState(): void {
    try {
      const idx = localStorage.getItem(KEY_INDEX_STORAGE);
      if (idx !== null) {
        this.currentIndex = parseInt(idx, 10) || 0;
      }
      const cds = localStorage.getItem(COOLDOWNS_STORAGE);
      if (cds) {
        this.cooldowns = JSON.parse(cds);
      }
    } catch {
      this.currentIndex = 0;
    }
  }

  private saveState(): void {
    try {
      localStorage.setItem(KEY_INDEX_STORAGE, this.currentIndex.toString());
      localStorage.setItem(COOLDOWNS_STORAGE, JSON.stringify(this.cooldowns));
    } catch (e) {
      console.warn('Could not persist key state:', e);
    }
  }

  public getActiveKey(): string {
    if (this.keys.length === 0) return '';
    return this.keys[this.currentIndex % this.keys.length];
  }

  public getActiveKeyIndex(): number {
    return (this.currentIndex % this.keys.length) + 1;
  }

  public getTotalKeys(): number {
    return this.keys.length;
  }

  public markKeyExhausted(index: number, cooldownMinutes = 5): void {
    const until = Date.now() + cooldownMinutes * 60 * 1000;
    this.cooldowns[index] = until;
    this.saveState();
  }

  public rotateToNextKey(): { index: number; key: string } {
    const total = this.keys.length;
    if (total === 0) return { index: 0, key: '' };

    const now = Date.now();
    let nextIdx = (this.currentIndex + 1) % total;

    // Try to find a key that is not in cooldown
    for (let i = 0; i < total; i++) {
      const testIdx = (this.currentIndex + 1 + i) % total;
      const cooldownUntil = this.cooldowns[testIdx];
      if (!cooldownUntil || cooldownUntil <= now) {
        nextIdx = testIdx;
        break;
      }
    }

    this.currentIndex = nextIdx;
    this.saveState();
    return {
      index: this.currentIndex + 1,
      key: this.keys[this.currentIndex]
    };
  }

  public getKeyStatuses(): KeyStatus[] {
    const now = Date.now();
    return this.keys.map((key, i) => {
      const cooldownUntil = this.cooldowns[i];
      const isExhausted = Boolean(cooldownUntil && cooldownUntil > now);
      return {
        index: i + 1,
        maskedKey: key.length > 12 ? `${key.substring(0, 8)}...${key.substring(key.length - 4)}` : 'Key',
        isExhausted,
        cooldownUntil
      };
    });
  }
}
