/**
 * Shared types for all Markify packages
 */

/**
 * HTTP fetcher interface — abstraction over GM.xmlHttpRequest / fetch / etc.
 * Each platform (userscript, CLI, MCP) provides its own implementation.
 */
export interface HttpFetcher {
    /**
     * Perform a GET request and return the response text
     */
    get(url: string, options?: FetchOptions): Promise<FetchResponse>;
}

export interface FetchOptions {
    /** Include cookies/credentials in the request */
    credentials?: boolean;
    /** Custom headers */
    headers?: Record<string, string>;
    /** Cancel requests when their owning export is destroyed. */
    signal?: AbortSignal;
    /** Finite request deadline supplied by the resolved profile. */
    timeoutMs?: number;
}

/** Per-export callbacks; never stored on a shared adapter. */
export interface ApiConversionContext {
    signal?: AbortSignal;
    onProgress?: (message: string) => void;
    onMetadata?: (metadata: Partial<SiteMetadata>) => void;
}

export interface FetchResponse {
    status: number;
    ok: boolean;
    text: string;
}

/**
 * Conversion strategy — controls how content is fetched and converted.
 *
 * - 'api-first': Try site API → Jina Reader → DOM fallback (recommended for CLI/MCP)
 * - 'api-only':  Only use APIs, fail if no API available
 * - 'dom-only':  Only use DOM parsing, no API calls (default for userscript)
 */
export type ConvertStrategy = 'api-first' | 'api-only' | 'dom-only';

/**
 * Options for converting a page to Markdown
 */
export interface ConvertOptions {
    /** The URL of the page being converted */
    url: string;
    /** Pre-fetched HTML (skip fetching if provided) */
    html?: string;
    /** A Document-like object for DOM queries (browser DOM or linkedom) */
    document?: MinimalDocument;
    /** Force a specific adapter by name */
    adapterName?: string;
    /** Whether to include YAML frontmatter */
    includeFrontmatter?: boolean;
    /** Template overrides */
    templates?: any;
    /** HTTP fetcher for API-based adapters */
    fetcher?: HttpFetcher;
    signal?: AbortSignal;
    onProgress?: (message: string) => void;
    /** Metadata captured before awaiting network requests. API metadata may refine it. */
    metadataSnapshot?: Partial<SiteMetadata>;
    /** Resolved immutable per-job profile (e.g. user preference overrides). */
    adapterConfig?: import('./config').AdapterConfig;
    /** Turndown conversion options */
    conversion?: ConversionConfig;
    /**
     * Conversion strategy.
     * - 'api-first': Prefer APIs (site API → Jina Reader), fall back to DOM (default for CLI/MCP)
     * - 'api-only':  Only use APIs, error if none available
     * - 'dom-only':  Only use DOM-based conversion (default for userscript)
     */
    strategy?: ConvertStrategy;
    /** Jina Reader configuration (token, selectors, etc.) */
    readerConfig?: import('./reader').ReaderConfig;
}

/**
 * Result of a conversion
 */
export interface ConvertResult {
    /** The final Markdown output */
    markdown: string;
    /** Extracted metadata */
    metadata: SiteMetadata;
    /** Name of the adapter used */
    adapter: string;
    /** Suggested filename (without extension) */
    filename: string;
}

/**
 * Turndown conversion configuration
 */
export interface ConversionConfig {
    headingStyle?: 'atx' | 'setext';
    codeBlockStyle?: 'fenced' | 'indented';
    emDelimiter?: '_' | '*';
    strongDelimiter?: '__' | '**';
    linkStyle?: 'inlined' | 'referenced';
    removeElements?: string[];
}

/**
 * Metadata extracted from a page
 */
export interface SiteMetadata {
    title: string;
    url: string;
    date: string;
    downloaded?: string;
    author?: string;
    description?: string;
    tags?: string[];
    source?: string;
    [key: string]: unknown;
}

/**
 * Minimal Document interface — subset of DOM Document.
 * Works with both real browser Document and linkedom/happy-dom.
 */
export interface MinimalDocument {
    title: string;
    body: MinimalElement;
    querySelector(selectors: string): MinimalElement | null;
    querySelectorAll(selectors: string): ArrayLike<MinimalElement>;
}

/**
 * Minimal Element interface
 */
export interface MinimalElement {
    textContent: string | null;
    innerHTML: string;
    outerHTML: string;
    getAttribute(name: string): string | null;
    querySelector(selectors: string): MinimalElement | null;
    querySelectorAll(selectors: string): ArrayLike<MinimalElement>;
    cloneNode(deep?: boolean): MinimalElement;
    remove(): void;
}
