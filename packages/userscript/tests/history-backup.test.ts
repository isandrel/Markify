import { describe, expect, test } from 'bun:test';
import { configureHistoryProfiles, exportHistory, importHistory, mergeHistory, parseHistoryBackup, type DownloadHistory, type HistoryStorage } from '../src/utils/download-history';

configureHistoryProfiles([{ site: { id: 'linuxdo', name: 'LINUX DO', aliases: ['linux.do'] } }, { site: { id: 'v2ex', aliases: [] } }]);
/** GM storage of one browser. */
function memory(initial: DownloadHistory = {}): HistoryStorage & { history: DownloadHistory } {
    const store = {
        history: initial,
        getValue: async () => structuredClone(store.history),
        setValue: async (_key: string, value: DownloadHistory) => { store.history = structuredClone(value); },
    };
    return store;
}
let store = memory();
const record = (id: string, downloadedAt: string, extra: Record<string, unknown> = {}) => ({ id, site: 'v2ex', title: `t${id}`, type: 'single' as const, downloadedAt, ...extra });

describe('download history backup', () => {
    test('a backup round-trips through a fresh browser', async () => {
        store = memory({ 'v2ex:1': record('1', '2026-01-02T00:00:00.000Z', { replies: 3, check: { at: '2026-01-03T00:00:00.000Z', replies: 4 } }), 'v2ex:2': record('2', '2026-01-01T00:00:00.000Z') });
        const backup = await exportHistory(store);
        expect(backup).toMatchObject({ kind: 'markify-download-history', version: 1 });
        expect(backup.records.map(entry => entry.id)).toEqual(['2', '1']);

        store = memory();
        expect(await importHistory(JSON.stringify(backup), store)).toEqual({ added: 2, updated: 0, unchanged: 0, skipped: 0 });
        expect(store.history['v2ex:1']).toEqual(backup.records[1]);
        // Importing the same file again changes nothing.
        expect(await importHistory(JSON.stringify(backup), store)).toEqual({ added: 0, updated: 0, unchanged: 2, skipped: 0 });
    });

    test('merging: nothing is removed; the later download wins; the later check is kept; aliases resolve', () => {
        const history: DownloadHistory = {
            'v2ex:1': record('1', '2026-01-05T00:00:00.000Z', { check: { at: '2026-01-01T00:00:00.000Z' } }),
            'v2ex:2': record('2', '2026-01-01T00:00:00.000Z'),
            'linuxdo:9': { ...record('9', '2026-01-01T00:00:00.000Z'), site: 'linuxdo' },
        };
        const result = mergeHistory(history, [
            record('1', '2026-01-02T00:00:00.000Z', { title: 'older', check: { at: '2026-02-01T00:00:00.000Z', replies: 7 } }),
            record('2', '2026-03-01T00:00:00.000Z', { title: 'newer', replies: 5 }),
            { ...record('9', '2026-01-01T00:00:00.000Z'), site: 'linux.do' },
            record('3', '2026-01-01T00:00:00.000Z'),
        ]);
        expect(result).toEqual({ added: 1, updated: 2, unchanged: 1 });
        expect(history['v2ex:1']).toMatchObject({ title: 't1', downloadedAt: '2026-01-05T00:00:00.000Z', check: { at: '2026-02-01T00:00:00.000Z', replies: 7 } });
        expect(history['v2ex:2']).toMatchObject({ title: 'newer', replies: 5 });
        expect(Object.keys(history).sort()).toEqual(['linuxdo:9', 'v2ex:1', 'v2ex:2', 'v2ex:3']);
    });

    test('only history backups are accepted; a settings backup is pointed to Settings; bad entries are skipped', () => {
        expect(() => parseHistoryBackup('{ nope')).toThrow('This file is not JSON.');
        expect(() => parseHistoryBackup(JSON.stringify({ schema_version: 1, global: {}, sites: {} }))).toThrow('This is a settings backup, not a download history. Import it in Settings.');
        expect(() => parseHistoryBackup('[]')).toThrow('This is not a Markify download history file.');
        expect(() => parseHistoryBackup(JSON.stringify({ kind: 'markify-download-history', version: 2, records: [] }))).toThrow('Unsupported download history version: 2');
        const parsed = parseHistoryBackup(JSON.stringify({ kind: 'markify-download-history', version: 1, records: [
            record('1', '2026-01-01T00:00:00.000Z', { replies: -1, extra: 'x', type: 'weird' }),
            { id: '2', site: 'v2ex' },
            null,
        ] }));
        expect(parsed).toEqual({ records: [{ id: '1', site: 'v2ex', title: 't1', type: 'single', downloadedAt: '2026-01-01T00:00:00.000Z' }], skipped: 2 });
    });
});
