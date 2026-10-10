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
