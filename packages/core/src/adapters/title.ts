import type { AdapterConfig } from '../config';
import type { MinimalDocument } from '../types';

/**
 * The page's own title: the first configured title element with text, else
 * document.title with the site suffix removed. Forum titles such as Discourse's
 * "Topic - Category - Site" make the element the reliable source.
 */
export function pageTitle(doc: MinimalDocument, profile: AdapterConfig): string {
    for (const selector of profile.metadata?.title_selectors ?? []) {
        let text: string | undefined;
        try { text = doc.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim(); } catch { /* invalid in this DOM */ }
        if (text) return text;
    }
    return profile.metadata?.title_cleanup ? doc.title.replace(new RegExp(profile.metadata.title_cleanup), '').trim() : doc.title;
}
