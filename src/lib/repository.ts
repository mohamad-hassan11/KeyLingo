import { isRecord } from "./preferences";

export type Envelope<T> = { schemaVersion: number; revision: number; savedAt: string; payload: T };
export type LoadResult<T> =
  | { status: "ok"; envelope: Envelope<T>; migrated: boolean }
  | { status: "empty" }
  | { status: "corrupt" | "unknown-version" | "unavailable" };
export type SaveResult<T> = { status: "ok"; envelope: Envelope<T> }
  | { status: "blocked" | "conflict" | "unavailable" | "invalid" };
export type StoragePort = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export interface Repository<T> {
  load(): Promise<LoadResult<T>>;
  save(payload: T, expectedRevision?: number): Promise<SaveResult<T>>;
}

export class LocalRepository<T> implements Repository<T> {
  constructor(private storage: StoragePort, readonly key: string,
    private validate: (value: unknown) => value is T,
    private version = 1,
    private migrate?: (version: number, payload: unknown) => unknown) {}

  decode(raw: string): LoadResult<T> {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isRecord(parsed) || !Number.isInteger(parsed.schemaVersion) || Number(parsed.schemaVersion) < 0
        || !Number.isSafeInteger(parsed.revision) || Number(parsed.revision) < 1
        || typeof parsed.savedAt !== "string" || !Number.isFinite(Date.parse(parsed.savedAt))) return { status: "corrupt" };
      let payload = parsed.payload;
      let version = Number(parsed.schemaVersion);
      if (version > this.version) return { status: "unknown-version" };
      const migrated = version < this.version;
      while (version < this.version) {
        if (!this.migrate) return { status: "unknown-version" };
        payload = this.migrate(version++, payload);
        if (payload === undefined) return { status: "corrupt" };
      }
      if (!this.validate(payload)) return { status: "corrupt" };
      return { status: "ok", migrated, envelope: { schemaVersion: this.version,
        revision: Number(parsed.revision), savedAt: parsed.savedAt, payload } };
    } catch { return { status: "corrupt" }; }
  }

  async load(): Promise<LoadResult<T>> {
    try { const raw = this.storage.getItem(this.key); return raw === null ? { status: "empty" } : this.decode(raw); }
    catch { return { status: "unavailable" }; }
  }

  async save(payload: T, expectedRevision?: number): Promise<SaveResult<T>> {
    if (!this.validate(payload)) return { status: "invalid" };
    try {
      const current = await this.load();
      if (current.status === "unavailable") return { status: "unavailable" };
      if (current.status !== "ok" && current.status !== "empty") return { status: "blocked" };
      const revision = current.status === "ok" ? current.envelope.revision : 0;
      if (expectedRevision !== undefined && revision !== expectedRevision) return { status: "conflict" };
      const envelope = { schemaVersion: this.version, revision: revision + 1, savedAt: new Date().toISOString(), payload };
      if (current.status === "ok") this.storage.setItem(`${this.key}.backup`, JSON.stringify(current.envelope));
      this.storage.setItem(this.key, JSON.stringify(envelope));
      return { status: "ok", envelope };
    } catch { return { status: "unavailable" }; }
  }

  async restoreBackup(): Promise<SaveResult<T>> {
    try {
      const raw = this.storage.getItem(`${this.key}.backup`);
      if (!raw) return { status: "invalid" };
      const result = this.decode(raw);
      if (result.status !== "ok") return { status: "invalid" };
      // Explicit recovery retains damaged primary data for export/inspection.
      const primary = this.storage.getItem(this.key);
      if (primary !== null) this.storage.setItem(`${this.key}.recovery`, primary);
      const envelope = { ...result.envelope, revision: result.envelope.revision + 1, savedAt: new Date().toISOString() };
      this.storage.setItem(this.key, JSON.stringify(envelope));
      return { status: "ok", envelope };
    } catch { return { status: "unavailable" }; }
  }

  async importJSON(raw: string): Promise<SaveResult<T>> {
    const decoded = this.decode(raw);
    if (decoded.status !== "ok") return { status: "invalid" };
    return this.save(decoded.envelope.payload);
  }

  async reset(payload: T): Promise<SaveResult<T>> {
    if (!this.validate(payload)) return { status: "invalid" };
    try {
      const raw = this.storage.getItem(this.key);
      if (raw !== null) this.storage.setItem(`${this.key}.recovery`, raw);
      const current = raw === null ? { status: "empty" as const } : this.decode(raw);
      const revision = current.status === "ok" ? current.envelope.revision + 1 : 1;
      const envelope = { schemaVersion: this.version, revision, savedAt: new Date().toISOString(), payload };
      this.storage.setItem(this.key, JSON.stringify(envelope));
      return { status: "ok", envelope };
    } catch { return { status: "unavailable" }; }
  }
}

export const storageKeys = { preferences: "keylingo.preferences", progress: "keylingo.progress", vocabulary: "keylingo.vocabulary" } as const;
// Separate envelopes are reserved; domain payload schemas arrive with their milestones.
