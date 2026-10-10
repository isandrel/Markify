import { describe, expect, test } from 'bun:test';
import { parseHTML } from 'linkedom';
import { loadConfigFromDisk } from '@markify/core/config/disk';
import { normalizeProfile } from '@markify/core/config';
import { ProfileBatchCapability } from '../src/adapters/profile-batch';
import { BatchDownloadManager } from '../src/batch/BatchDownloadManager';
import { configureHistoryProfiles, normalizeHistory } from '../src/utils/download-history';

const profiles = loadConfigFromDisk().adapters;
const profile = profiles['1point3acres'];
const uscfProfile = profiles.uscardforum;

function listing(count = 3) {
    const rows = Array.from({ length: count }, (_, index) => {
        const id = String(100 + index);
        return `<div data-sentry-component="ForumThreadItem"><a href="/home/thread/${id}"><h3${index ? ` title="Title $${id}"` : ''}>${index ? 'short' : `Fallback $${id}`}</h3></a></div>`;
    }).join('');
    return parseHTML(`<html><body><main><h1>求职</h1>${rows}</main><aside><a href="/home/thread/999"><h3>Sidebar</h3></a></aside></body></html>`).document;
}

describe('profile batch extraction', () => {
    test('extracts exact feed rows and excludes sidebar links', () => {
        const document = listing(20);
        const capability = new ProfileBatchCapability(profile, async () => 'ok', {
            document: document as unknown as Document,
            url: () => 'https://www.1point3acres.com/home/discover/38?page=1',
        });
        const rows = capability.extractRows();
        expect(rows).toHaveLength(20);
        expect(rows.map(row => row.id)).not.toContain('999');
        expect(rows[0].title).toBe('Fallback $100');
        expect(rows[0].url).toBe('https://www.1point3acres.com/home/thread/100');
        expect(capability.diagnostic).toMatchObject({ layout: 'forum-thread-items', status: 'ready', count: 20 });
        expect(capability.getFilenameContext()).toEqual({ site: '1point3acres', type: 'discover', id: '38', tagname: '求职' });
    });

    test('reports unsupported layout without collecting global links', () => {
        const document = parseHTML('<html><body><main></main><a href="/home/thread/123">outside</a></body></html>').document;
        const capability = new ProfileBatchCapability(profile, async () => 'ok', {
            document: document as unknown as Document,
            url: () => 'https://www.1point3acres.com/home/discover/38',
        });
        expect(capability.extractRows()).toEqual([]);
        expect(capability.diagnostic.status).toBe('unsupported');
    });

    test('uses the same manager contract for a second configured site', () => {
        const document = parseHTML('<html><body><h1>Cards</h1><div id="main-outlet"><tr class="topic-list-item"><td><a class="title" href="/t/welcome/123">Welcome</a></td></tr></div></body></html>').document;
        const capability = new ProfileBatchCapability(uscfProfile, async () => 'ok', {
            document: document as unknown as Document,
            url: () => 'https://www.uscardforum.com/c/cards',
        });
        expect(capability.extractRows().map(row => row.id)).toEqual(['123']);
        expect(capability.getFilenameContext()).toMatchObject({ site: 'uscardforum', type: 'category', id: 'cards' });
    });
});

describe('batch manager integrity', () => {
    test('creates files and history only for complete successes, retaining failed selection', async () => {
        const document = listing();
        const configured = structuredClone(profile);
        configured.filename.batch_item = '{index} - [{id}] {title}';
        configured.filename.batch = '[{site}] [{type}] [{id}] {tagname}';
        const capability = new ProfileBatchCapability(normalizeProfile(configured), async id => {
            if (id === '101') throw new Error('blocked');
            return `# ${id}`;
        }, { document: document as unknown as Document, url: () => 'https://www.1point3acres.com/home/discover/38' });
        let zipped: { name: string; input: string }[] = [];
        let downloaded = '';
        let recorded: string[] = [];
        const notices: string[] = [];
        const manager = new BatchDownloadManager(capability, {
            document: document as unknown as Document,
            history: async () => [], delay: async () => undefined,
            zip: async files => { zipped = files; return new Blob(['zip']); },
            download: (_blob, filename) => { downloaded = filename; },
            saveHistory: async items => { recorded = items.map(item => item.id); },
            notify: message => notices.push(message),
        });
        manager.initializeUI();
        await manager.refresh();
        const selectAll = document.querySelector('#markify-select-all') as HTMLInputElement;
        selectAll.checked = true;
        selectAll.dispatchEvent(new document.defaultView!.Event('change'));
        await manager.downloadSelected();
        expect(zipped.map(file => file.name)).toEqual(['001 - [100] Fallback $100.md', '003 - [102] Title $102.md']);
        expect(recorded).toEqual(['100', '102']);
        expect(downloaded).toContain('[1point3acres] [discover] [38] 求职.zip');
        expect(notices.at(-1)).toContain('2/3');
        expect((document.querySelector('[data-item-id="101"]') as HTMLInputElement).checked).toBe(true);
        expect((document.querySelector('#markify-batch-panel button') as HTMLButtonElement).textContent).toContain('(1)');
        manager.destroy();
        expect(document.querySelector('#markify-batch-panel')).toBeNull();
        expect(document.querySelector('.markify-checkbox-wrapper')).toBeNull();
    });

    test('destroy cancels a running job and suppresses download/history', async () => {
        const document = listing(1);
        let release!: (value: string) => void;
        const pending = new Promise<string>(resolve => { release = resolve; });
        const capability = new ProfileBatchCapability(profile, async () => pending, {
            document: document as unknown as Document, url: () => 'https://www.1point3acres.com/home/discover/38',
        });
        let downloads = 0;
        let history = 0;
        const manager = new BatchDownloadManager(capability, {
            document: document as unknown as Document, history: async () => [], delay: async () => undefined,
            zip: async () => new Blob(), download: () => { downloads++; },
            saveHistory: async () => { history++; }, notify: () => undefined,
        });
        manager.initializeUI();
        await manager.refresh();
        const checkbox = document.querySelector('.markify-batch-checkbox') as HTMLInputElement;
        checkbox.checked = true;
        checkbox.dispatchEvent(new document.defaultView!.Event('change'));
        const job = manager.downloadSelected();
        manager.destroy();
        release('# late');
        await job;
        expect(downloads).toBe(0);
        expect(history).toBe(0);
    });

    test('a second click cannot start a second batch job', async () => {
        const document = listing(1);
        let calls = 0;
        let release!: (value: string) => void;
        const pending = new Promise<string>(resolve => { release = resolve; });
        const capability = new ProfileBatchCapability(profile, async () => { calls++; return pending; }, {
            document: document as unknown as Document, url: () => 'https://www.1point3acres.com/home/discover/38',
        });
        const manager = new BatchDownloadManager(capability, {
            document: document as unknown as Document, history: async () => [], delay: async () => undefined,
            zip: async () => new Blob(), download: () => undefined, saveHistory: async () => undefined, notify: () => undefined,
        });
        manager.initializeUI();
        await manager.refresh();
        const checkbox = document.querySelector('.markify-batch-checkbox') as HTMLInputElement;
        checkbox.checked = true;
        checkbox.dispatchEvent(new document.defaultView!.Event('change'));
        const first = manager.downloadSelected();
        const second = manager.downloadSelected();
        await Promise.resolve();
        expect(calls).toBe(1);
        release('# complete');
        await Promise.all([first, second]);
        manager.destroy();
    });
});

test('history aliases normalize without dropping unrelated records', () => {
    configureHistoryProfiles(Object.values(profiles));
    const history = normalizeHistory({
        'old:1': { id: '1', site: '1Point3Acres', title: 'old', downloadedAt: '2025-01-01T00:00:00Z', type: 'single' },
        'new:1': { id: '1', site: '1point3acres', title: 'new', downloadedAt: '2026-01-01T00:00:00Z', type: 'batch' },
        'caps:1': { id: '1', site: '1POINT3ACRES', title: 'caps', downloadedAt: '2024-01-01T00:00:00Z', type: 'single' },
        'other:2': { id: '2', site: 'other', title: 'other', downloadedAt: '2026-01-01T00:00:00Z', type: 'single' },
    });
    expect(Object.keys(history).sort()).toEqual(['1point3acres:1', 'other:2']);
    expect(history['1point3acres:1'].title).toBe('new');
});

describe('update status of downloaded threads', () => {
    test('later activity or more replies than at download time', async () => {
        const { updateStatus } = await import('../src/utils/download-history');
        const record = { downloadedAt: '2026-02-01T00:00:00.000Z', replies: 10 };
        expect(updateStatus(record)).toEqual({ changed: false, checked: false });
        expect(updateStatus(record, { replies: 10, updated: '2026-01-31T00:00:00.000Z' })).toEqual({ changed: false, newReplies: undefined, checked: true });
        expect(updateStatus(record, { replies: 13, updated: '2026-02-03T00:00:00.000Z' })).toEqual({ changed: true, newReplies: 3, checked: true });
        // An edit or nested reply can move the activity without the count.
        expect(updateStatus(record, { replies: 10, updated: '2026-02-03T00:00:00.000Z' }).changed).toBe(true);
        // Records from older versions have no reply count: activity alone decides.
        expect(updateStatus({ downloadedAt: '2026-02-01T00:00:00.000Z' }, { replies: 50, updated: '2026-01-01T00:00:00.000Z' }).changed).toBe(false);
    });
});
