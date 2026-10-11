/** Stable identities and compatibility reads are supplied by the profile registry. */
export interface DownloadRecord {
    id: string;
    site: string;
    title: string;
    downloadedAt: string;
    type: 'single' | 'batch';
    /** The thread's state when downloaded (absent in records from older versions). */
    replies?: number;
    updated?: string;
    /** The latest state Markify saw on the site, from a check or a listing. */
    check?: { at: string; replies?: number; updated?: string };
}
/** What a thread looked like at download time; saved with the record. */
export interface ThreadSnapshot { replies?: number; updated?: string }
export interface UpdateStatus { changed: boolean; newReplies?: number; checked: boolean }

/**
 * Whether a downloaded thread changed since: activity after the download, or
 * more replies than it had then. Works for old records without a snapshot too.
 */
export function updateStatus(record: Pick<DownloadRecord, 'downloadedAt' | 'replies' | 'check'>, latest: ThreadSnapshot | undefined = record.check): UpdateStatus {
    if (!latest) return { changed: false, checked: false };
    const newReplies = typeof latest.replies === 'number' && typeof record.replies === 'number' && latest.replies > record.replies ? latest.replies - record.replies : undefined;
    const active = latest.updated ? Date.parse(latest.updated) > Date.parse(record.downloadedAt) : false;
    return { changed: active || newReplies !== undefined, newReplies, checked: true };
}
export type DownloadHistory = Record<string, DownloadRecord>;
export interface HistoryStorage {
    getValue(key: string, fallback: DownloadHistory): Promise<DownloadHistory>;
    setValue(key: string, value: DownloadHistory): Promise<unknown>;
}
export interface HistoryIdentity { site: { id: string; name?: string; aliases: readonly string[] } }
const STORAGE_KEY = 'markify_download_history';
let aliases = new Map<string, string>();
let writes: Promise<unknown> = Promise.resolve();
const storage: HistoryStorage = {
    getValue: async (key, fallback) => GM.getValue(key, fallback) as Promise<DownloadHistory>,
    setValue: (key, value) => GM.setValue(key, value),
};

export function configureHistoryProfiles(profiles: readonly HistoryIdentity[]): void {
    const next = new Map<string, string>();
    for (const profile of profiles) {
        for (const alias of [profile.site.id, ...(profile.site.name ? [profile.site.name] : []), ...profile.site.aliases]) {
            const key = alias.toLowerCase();
            if (next.has(key) && next.get(key) !== profile.site.id) throw new Error(`Conflicting history alias: ${alias}`);
            next.set(key, profile.site.id);
        }
    }
    aliases = next;
}
const canonical = (site: string): string => aliases.get(site.toLowerCase()) ?? site;
const keyFor = (id: string, site: string): string => `${canonical(site)}:${id}`;

/** Keep latest logical record; unrelated sites and legacy storage remain intact. */
export function normalizeHistory(history: DownloadHistory): DownloadHistory {
    const merged: DownloadHistory = {};
    for (const record of Object.values(history)) {
        if (!record || typeof record.id !== 'string' || typeof record.site !== 'string') continue;
        const key = keyFor(record.id, record.site);
        if (!merged[key] || record.downloadedAt >= merged[key].downloadedAt) merged[key] = { ...record, site: canonical(record.site) };
    }
    return merged;
}

export async function getDownloadHistory(store: HistoryStorage = storage): Promise<DownloadRecord[]> {
    return Object.values(normalizeHistory(await store.getValue(STORAGE_KEY, {})));
}
export async function isDownloaded(id: string, site: string): Promise<boolean> {
    return (await getDownloadHistory()).some(record => record.id === id && record.site === canonical(site));
}
function mutate(change: (history: DownloadHistory) => void, store: HistoryStorage, active: () => boolean = () => true): Promise<void> {
    const task = writes.catch(() => undefined).then(async () => {
        if (!active()) return;
        const history = await store.getValue(STORAGE_KEY, {});
        if (!active()) return;
        change(history);
        await store.setValue(STORAGE_KEY, history);
    });
    writes = task;
    return task;
}
const snapshotOf = (value: ThreadSnapshot | undefined): ThreadSnapshot => ({
    ...(typeof value?.replies === 'number' ? { replies: value.replies } : {}),
    ...(typeof value?.updated === 'string' && value.updated ? { updated: value.updated } : {}),
});
export async function markManyAsDownloaded(
    items: readonly ({ id: string; title: string } & ThreadSnapshot)[], site: string, type: DownloadRecord['type'],
    active: () => boolean = () => true, store: HistoryStorage = storage,
): Promise<void> {
    const downloadedAt = new Date().toISOString();
    await mutate(history => {
        for (const item of items) history[keyFor(item.id, site)] = { id: item.id, title: item.title, ...snapshotOf(item), site: canonical(site), type, downloadedAt };
    }, store, active);
}
export async function markAsDownloaded(id: string, site: string, title: string, type: DownloadRecord['type'], snapshot?: ThreadSnapshot): Promise<void> {
    await markManyAsDownloaded([{ id, title, ...snapshot }], site, type);
}
/** Saves the latest state seen on the site for a downloaded thread; returns its update status. */
export async function recordCheck(id: string, site: string, latest: ThreadSnapshot): Promise<UpdateStatus | undefined> {
    let status: UpdateStatus | undefined;
    await mutate(history => {
        for (const record of Object.values(history)) {
            if (!record || keyFor(record.id, record.site) !== keyFor(id, site)) continue;
            record.check = { at: new Date().toISOString(), ...snapshotOf(latest) };
            status = updateStatus(record);
        }
    }, storage);
    return status;
}
export async function removeDownload(id: string, site: string): Promise<void> {
    await mutate(history => {
        for (const [key, record] of Object.entries(history)) if (keyFor(record.id, record.site) === keyFor(id, site)) delete history[key];
    }, storage);
}
export async function clearSiteHistory(site: string): Promise<void> {
    await mutate(history => {
        for (const [key, record] of Object.entries(history)) if (record && canonical(record.site) === canonical(site)) delete history[key];
    }, storage);
}
export async function clearHistory(): Promise<void> {
    await mutate(history => { for (const key of Object.keys(history)) delete history[key]; }, storage);
}
export async function getDownloadStats(): Promise<{ total: number; single: number; batch: number }> {
    const records = await getDownloadHistory();
    return { total: records.length, single: records.filter(r => r.type === 'single').length, batch: records.filter(r => r.type === 'batch').length };
}

/**
 * Backup file for the download history. It is separate from the settings backup
 * (Settings → copy configuration): settings say how to export, this says what was
 * exported. Each importer refuses the other's file and says where it belongs.
 */
export const HISTORY_BACKUP_KIND = 'markify-download-history';
export interface HistoryBackup { kind: typeof HISTORY_BACKUP_KIND; version: 1; exportedAt: string; records: DownloadRecord[] }
export interface HistoryImportResult { added: number; updated: number; unchanged: number; skipped: number }

export function isHistoryBackup(value: unknown): boolean {
    return typeof value === 'object' && value !== null && (value as { kind?: unknown }).kind === HISTORY_BACKUP_KIND;
}

export async function exportHistory(store: HistoryStorage = storage): Promise<HistoryBackup> {
    const records = (await getDownloadHistory(store)).sort((a, b) => a.downloadedAt.localeCompare(b.downloadedAt));
    return { kind: HISTORY_BACKUP_KIND, version: 1, exportedAt: new Date().toISOString(), records };
}

const isDate = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));
const isCount = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0;

/** A clean record, or undefined for an entry that isn't one. Unknown fields are dropped. */
function cleanRecord(value: unknown): DownloadRecord | undefined {
    if (typeof value !== 'object' || value === null) return undefined;
    const entry = value as Record<string, unknown>;
    if (typeof entry.id !== 'string' || !entry.id || typeof entry.site !== 'string' || !entry.site || !isDate(entry.downloadedAt)) return undefined;
    const record: DownloadRecord = {
        id: entry.id, site: entry.site, title: typeof entry.title === 'string' ? entry.title : entry.id,
        downloadedAt: entry.downloadedAt, type: entry.type === 'batch' ? 'batch' : 'single',
    };
    if (isCount(entry.replies)) record.replies = entry.replies;
    if (isDate(entry.updated)) record.updated = entry.updated;
    const check = entry.check as Record<string, unknown> | undefined;
    if (check && typeof check === 'object' && isDate(check.at)) {
        record.check = { at: check.at, ...(isCount(check.replies) ? { replies: check.replies } : {}), ...(isDate(check.updated) ? { updated: check.updated } : {}) };
    }
    return record;
}

/** The records of a history backup file; throws with a readable reason for anything else. */
export function parseHistoryBackup(text: string): { records: DownloadRecord[]; skipped: number } {
    let value: unknown;
    try { value = JSON.parse(text); } catch { throw new Error('This file is not JSON.'); }
    if (!isHistoryBackup(value)) {
        const settings = typeof value === 'object' && value !== null && 'schema_version' in value;
        throw new Error(settings
            ? 'This is a settings backup, not a download history. Import it in Settings.'
            : 'This is not a Markify download history file.');
    }
    const backup = value as { version?: unknown; records?: unknown };
    if (backup.version !== 1) throw new Error(`Unsupported download history version: ${String(backup.version)}`);
    if (!Array.isArray(backup.records)) throw new Error('The download history file has no records.');
    const records = backup.records.map(cleanRecord).filter((record): record is DownloadRecord => !!record);
    return { records, skipped: backup.records.length - records.length };
}

/**
 * Merges imported records into the stored history; nothing is removed. For a thread
 * in both, the later download wins, and the later check is kept either way.
 */
export function mergeHistory(history: DownloadHistory, incoming: readonly DownloadRecord[]): Omit<HistoryImportResult, 'skipped'> {
    const result = { added: 0, updated: 0, unchanged: 0 };
    const existing = new Map(Object.entries(history).filter(([, record]) => record && typeof record.id === 'string').map(([key, record]) => [keyFor(record.id, record.site), key]));
    for (const record of incoming) {
        const key = keyFor(record.id, record.site);
        const storedKey = existing.get(key);
        const current = storedKey ? history[storedKey] : undefined;
        if (!current) { history[key] = { ...record, site: canonical(record.site) }; existing.set(key, key); result.added++; continue; }
        const newer = Date.parse(record.downloadedAt) > Date.parse(current.downloadedAt);
        const base = newer ? { ...record, site: canonical(record.site) } : current;
        const checks = [current.check, record.check].filter((check): check is NonNullable<DownloadRecord['check']> => !!check);
        const check = checks.sort((a, b) => Date.parse(b.at) - Date.parse(a.at))[0];
        const next: DownloadRecord = { ...base, ...(check ? { check } : {}) };
        if (JSON.stringify(next) === JSON.stringify(current)) { result.unchanged++; continue; }
        if (storedKey !== key) delete history[storedKey!];
        history[key] = next;
        result.updated++;
    }
    return result;
}

export async function importHistory(text: string, store: HistoryStorage = storage): Promise<HistoryImportResult> {
    const { records, skipped } = parseHistoryBackup(text);
    let result = { added: 0, updated: 0, unchanged: 0 };
    await mutate(history => { result = mergeHistory(history, records); }, store);
    return { ...result, skipped };
}
