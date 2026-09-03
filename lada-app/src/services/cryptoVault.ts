import type { AuthVault } from '../types';

const VAULT_STORAGE_KEY = 'lada_encrypted_vault_v1';

// Pre-encrypted AES-GCM 256-bit vault (Zero plaintext keys in source code)
// Initial Master PIN: 2026 (Can be changed anytime inside the app)
export const DEFAULT_ENCRYPTED_VAULT: AuthVault = {
  pinHash: "KxZgIeJg8OGQpl5ZwlKLvBRUmEApQrCkTxdn22Tq6T4=",
  salt: "DWi9temWdeS56B/N5ZikPQ==",
  iv: "ERLaTXjRh6kEuwJh",
  encryptedKeys: "3jkBwRFB3WrFTkKqIg7FpwvUsHmT2dn4+cXSEApVLQnkhw9jK06bQFm8iBSQGJMwBSk2cjTVspcl6Rzqlru83Y13XGsg+pnMkXXM8X8op6o9rvF6F6Gj+mnL5bJqFKAQEW6zX8QWdZIBhQHq8AJcxNHDoQ3D9ZI9MQxCllm478oA23CrQE+1Z6VPDW4CcB4CbmLSyjsIl1GqBv6H0DdLIbUXwHw7iOkrjZ0Ln5HclZfcwm0A+enAeWu0VOdqdCMvngM/g2ICuGUSbtpf2aYngLG+HAUNQomxgifAOs4VzxDU6h/CAd5oiNZeJpaqn/qiUWQBJ/1K/bkdvsX5KOwC/WwcoWI5+sHFMsiaLQSGV+MnOXTfKHyZR0GcvoFF0JxDSqy9h2J8m3eSbofkjFJjMQbRnsZRFtEFQw4TMNbt373xVyI3GU6xk15SUygUZRCe+iUIr5To2WSvodPnoCdQbEM="
};

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function hashPin(pin: string, salt: Uint8Array): Promise<string> {
  const enc = new TextEncoder();
  const data = new Uint8Array(pin.length + salt.length);
  data.set(enc.encode(pin));
  data.set(salt, pin.length);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return bufferToBase64(hash);
}

export function isVaultInitialized(): boolean {
  return true;
}

export async function setupInitialVault(pin: string, initialKeys: string[] = []): Promise<boolean> {
  try {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(pin, salt);
    const pinHash = await hashPin(pin, salt);

    const enc = new TextEncoder();
    const dataToEncrypt = enc.encode(JSON.stringify(initialKeys));

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      key,
      dataToEncrypt
    );

    const vault: AuthVault = {
      pinHash,
      salt: bufferToBase64(salt.buffer),
      iv: bufferToBase64(iv.buffer),
      encryptedKeys: bufferToBase64(encrypted)
    };

    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault));
    return true;
  } catch (err) {
    console.error('Failed to setup vault:', err);
    return false;
  }
}

export async function unlockVault(pin: string): Promise<string[] | null> {
  try {
    let vault: AuthVault;
    const stored = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!stored) {
      vault = DEFAULT_ENCRYPTED_VAULT;
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault));
    } else {
      vault = JSON.parse(stored);
    }
    const salt = new Uint8Array(base64ToBuffer(vault.salt));
    const iv = new Uint8Array(base64ToBuffer(vault.iv));

    // Check PIN hash first
    const testHash = await hashPin(pin, salt);
    if (testHash !== vault.pinHash) {
      return null; // Invalid PIN
    }

    // Decrypt keys
    const key = await deriveKey(pin, salt);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      key,
      base64ToBuffer(vault.encryptedKeys)
    );

    const dec = new TextDecoder();
    const keysJson = dec.decode(decrypted);
    return JSON.parse(keysJson) as string[];
  } catch (err) {
    console.warn('Unlock failed:', err);
    return null;
  }
}

export async function saveKeys(keys: string[], pin: string): Promise<boolean> {
  return setupInitialVault(pin, keys);
}
