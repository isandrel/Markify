export interface NavigationRoute { key: string; pollMs: number }
export interface NavigationOptions<T extends NavigationRoute> {
    window: Window;
    resolve: (url: string) => T | null;
    onRoute: (route: T | null, url: string) => void;
    onError: (error: unknown) => void;
    fallbackPollMs?: number;
}

/** URL polling complements events across isolated userscript execution worlds. */
export class NavigationController<T extends NavigationRoute> {
    private timer: ReturnType<typeof setInterval> | undefined;
    private key: string | null | undefined;
    private lastUrl = '';
    private active = false;
    private interval = 0;

    constructor(private readonly options: NavigationOptions<T>) {}

    start(): void {
        if (this.active) return;
        this.active = true;
        this.key = undefined;
        this.lastUrl = '';
        this.options.window.addEventListener('popstate', this.check);
        this.options.window.addEventListener('hashchange', this.check);
        this.check();
        if (!this.timer) this.setPoll(this.options.fallbackPollMs ?? 500);
    }

    private setPoll(milliseconds: number): void {
        if (this.timer && this.interval === milliseconds) return;
        clearInterval(this.timer);
        this.interval = milliseconds;
        this.timer = setInterval(this.check, milliseconds);
    }

    readonly check = (): void => {
        if (!this.active) return;
        const url = this.options.window.location.href;
        if (url === this.lastUrl) return;
        this.lastUrl = url;
        try {
            const route = this.options.resolve(url);
            this.setPoll(route?.pollMs ?? this.options.fallbackPollMs ?? 500);
            const key = route?.key ?? null;
            if (key !== this.key) {
                this.key = key;
                this.options.onRoute(route, url);
            }
        } catch (error) {
            // Tear down the old route before surfacing ambiguous/invalid profiles.
            this.key = null;
            this.options.onRoute(null, url);
            this.options.onError(error);
        }
    };

    stop(): void {
        this.active = false;
        clearInterval(this.timer);
        this.timer = undefined;
        this.options.window.removeEventListener('popstate', this.check);
        this.options.window.removeEventListener('hashchange', this.check);
    }
}
