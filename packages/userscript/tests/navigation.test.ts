import { expect, test } from 'bun:test';
import { NavigationController } from '../src/navigation';

function browser() {
    return Object.assign(new EventTarget(), { location: { href: 'https://example.test/list?page=1' } }) as unknown as Window;
}

test('route lifecycle detects history changes, back, and stops cleanly', async () => {
    const window = browser();
    const changes: (string | null)[] = [];
    const controller = new NavigationController({
        window,
        resolve: url => url.includes('/list') ? { key: url, pollMs: 5 } : null,
        onRoute: route => changes.push(route?.key ?? null),
        onError: error => { throw error; },
        fallbackPollMs: 5,
    });
    controller.start();
    controller.start();
    window.location.href = 'https://example.test/list?page=2';
    await Bun.sleep(20);
    window.location.href = 'https://example.test/list?page=1';
    window.dispatchEvent(new Event('popstate'));
    window.location.href = 'https://example.test/other';
    controller.check();
    expect(changes).toEqual(['https://example.test/list?page=1', 'https://example.test/list?page=2', 'https://example.test/list?page=1', null]);
    controller.stop();
    window.location.href = 'https://example.test/list?page=3';
    window.dispatchEvent(new Event('popstate'));
    await Bun.sleep(15);
    expect(changes.length).toBe(4);
});

test('invalid profile clears active route and reports error', () => {
    const window = browser();
    const changes: unknown[] = [];
    const errors: unknown[] = [];
    const controller = new NavigationController({ window,
        resolve: () => { throw new Error('Ambiguous route'); },
        onRoute: route => changes.push(route), onError: error => errors.push(error),
    });
    controller.start();
    controller.stop();
    expect(changes).toEqual([null]);
    expect(errors).toHaveLength(1);
});
