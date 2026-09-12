export type ConversionErrorCode =
    | 'CONFIG_INVALID' | 'UNSUPPORTED_ROUTE' | 'HTTP_ERROR' | 'NETWORK_ERROR'
    | 'TIMEOUT' | 'ABORTED' | 'INVALID_RESPONSE' | 'API_REJECTED'
    | 'ACCESS_DENIED' | 'REPEATED_PAGE' | 'PAGE_LIMIT' | 'INCOMPLETE_CONTENT';

/** An attempted dedicated export failed. Callers must not silently fall back. */
export class ConversionError extends Error {
    constructor(
        public readonly code: ConversionErrorCode,
        message: string,
        public readonly details: { stage?: string; adapterId?: string; status?: number; page?: number } = {},
    ) {
        super(message);
        this.name = 'ConversionError';
    }
}

export function assertNotAborted(signal?: AbortSignal): void {
    if (signal?.aborted) throw new ConversionError('ABORTED', 'Export cancelled');
}
