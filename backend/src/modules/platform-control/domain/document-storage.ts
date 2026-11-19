export interface DocumentStorage {
  put(storageKey: string, content: Buffer): Promise<void>;
  read(storageKey: string): Promise<Buffer>;
  remove(storageKey: string): Promise<void>;
}
export const DOCUMENT_STORAGE = Symbol('DOCUMENT_STORAGE');
