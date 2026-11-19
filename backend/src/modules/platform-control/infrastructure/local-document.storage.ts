import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import type { DocumentStorage } from '../domain/document-storage';

@Injectable()
export class LocalDocumentStorage implements DocumentStorage {
  private readonly root = resolve(process.cwd(), '.private', 'documents');
  private path(storageKey: string) {
    if (!/^[a-z0-9/-]{10,160}$/u.test(storageKey) || storageKey.includes('..'))
      throw new ServiceUnavailableException('Document storage key is invalid.');
    const target = resolve(this.root, storageKey);
    if (!target.startsWith(`${this.root}${sep}`))
      throw new ServiceUnavailableException('Document storage key is invalid.');
    return target;
  }
  async put(storageKey: string, content: Buffer) {
    const target = this.path(storageKey);
    await mkdir(resolve(target, '..'), { recursive: true });
    await writeFile(target, content, { flag: 'wx', mode: 0o600 });
  }
  read(storageKey: string) {
    return readFile(this.path(storageKey));
  }
  async remove(storageKey: string) {
    await rm(this.path(storageKey), { force: true });
  }
}

export class UnavailableDocumentStorage implements DocumentStorage {
  private unavailable(): never {
    throw new ServiceUnavailableException(
      'Production object storage is not configured.',
    );
  }
  put(): Promise<void> {
    return this.unavailable();
  }
  read(): Promise<Buffer> {
    return this.unavailable();
  }
  remove(): Promise<void> {
    return this.unavailable();
  }
}
