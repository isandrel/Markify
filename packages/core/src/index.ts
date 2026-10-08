/**
 * @markify/core — Platform-agnostic conversion engine
 *
 * Shared by:
 * - @markify/userscript (browser Tampermonkey)
 * - @markify/cli (terminal)
 * - @markify/mcp (MCP server for AI agents)
 */

// Main converter
export { convert } from './converter';

// Configuration
export {
    getConfig,
    setConfig,
    getAdapterConfig,
    extractIdFromUrl,
    interpolate,
} from './config';
export type { AdapterConfig, MarkifyConfig } from './config';

// Reader (API-based conversion)
export { fetchViaJinaReader, hasSiteApi } from './reader';
export type { ReaderConfig, ReaderResult } from './reader';

// Types
export type {
    ConvertOptions,
    ConvertResult,
    ConvertStrategy,
    ConversionConfig,
    SiteMetadata,
    MinimalDocument,
    MinimalElement,
    HttpFetcher,
    FetchOptions,
    FetchResponse,
    ApiConversionContext,
} from './types';

// Adapters
export {
    findSiteAdapter,
    matchesPattern,
    builtInAdapters,
    getBuiltInAdapters,
    listAdapters,
    fetchUSCardForumContent,
    fetchDiscourseRawContent,
    fetch1Point3AcresContent,
    fetchForumApiContent,
} from './adapters';
export { createProfileAdapter, getProfileAdapters, findProfileAdapter, contentEngines } from './adapters/engines';
export { classifyRoute, classifyRegistryRoute } from './adapters/routes';
export type { SiteAdapter } from './adapters/base';
export { ConversionError } from './errors';

// Templates
export {
    replacePlaceholders,
    applyCommentTemplate,
    applyDocumentTemplate,
    parseForumPosts,
    defaultTemplates,
} from './templates';
export type { MarkdownTemplates } from './templates';

// Utilities
export {
    sanitizeFilename,
    formatDate,
    generateFrontmatter,
    extractMainContent,
    formatMessage,
} from './utils';

export { applyFilenameTemplate } from './utils/filename';
export type { FilenameContext } from './utils/filename';

export { Logger, LogLevel, logger, batchLogger, adapterLogger, routeLogsToStderr } from './utils/logger';

export { getUserAgent, humanDelay, sleep, buildHeaders } from './utils/http';
export type { DelayConfig } from './utils/http';
