/** Shared look and language for Markify's in-page dialogs (settings, download history). */

const zh = typeof navigator !== 'undefined' && /^zh\b/i.test(navigator.language);
/** English or Chinese, following the browser language. */
export const t = (english: string, chinese: string) => (zh ? chinese : english);

export const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);

/** Mounts an open shadow root on the page, so site styles cannot reach the dialog. */
export function mountDialog(id: string): { element: HTMLElement; root: ShadowRoot; close: () => void } {
    document.getElementById(id)?.remove();
    const element = document.createElement('div');
    element.id = id;
    element.setAttribute('data-markify-owned', id);
    const root = element.attachShadow({ mode: 'open' });
    document.body.appendChild(element);
    return { element, root, close: () => element.remove() };
}

export const DIALOG_STYLE = `
:host { all: initial; }
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; z-index: 2147483646;
  font: 14px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif; color: #e5e7eb; }
.panel { background: #18181b; border: 1px solid #3f3f46; border-radius: 14px; width: min(680px, calc(100vw - 32px)); max-height: calc(100vh - 48px);
  display: flex; flex-direction: column; box-shadow: 0 24px 64px rgba(0,0,0,.5); }
header, footer { padding: 16px 20px; display: flex; gap: 12px; align-items: center; }
header { border-bottom: 1px solid #3f3f46; }
footer { border-top: 1px solid #3f3f46; justify-content: flex-end; }
h2 { margin: 0; font-size: 18px; color: #c4b5fd; flex: 1; }
main { padding: 4px 20px 16px; overflow-y: auto; }
section { padding: 14px 0; border-bottom: 1px solid #27272a; }
section:last-child { border-bottom: 0; }
h3 { margin: 0 0 10px; font-size: 13px; text-transform: uppercase; letter-spacing: .04em; color: #a1a1aa; }
label.row { display: grid; grid-template-columns: 170px 1fr; gap: 10px; align-items: center; margin: 8px 0; }
label.check { display: flex; gap: 8px; align-items: center; white-space: nowrap; }
input[type=text], input[type=number], select, textarea { box-sizing: border-box; width: 100%; padding: 7px 10px; border-radius: 8px; border: 1px solid #52525b;
  background: #27272a; color: #f4f4f5; font: inherit; }
textarea { min-height: 84px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
input::placeholder, textarea::placeholder { color: #71717a; }
.hint { color: #a1a1aa; font-size: 12px; margin: 4px 0 0; }
.preview { color: #a7f3d0; font-family: ui-monospace, monospace; font-size: 12px; }
.buttons { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
button { padding: 8px 14px; border-radius: 8px; border: 1px solid #52525b; background: #3f3f46; color: #fafafa; font: inherit; cursor: pointer; }
button:hover { background: #52525b; }
button.primary { background: #7c3aed; border-color: #7c3aed; }
button.primary:hover { background: #6d28d9; }
button.danger { border-color: #7f1d1d; background: #450a0a; }
.error { color: #fca5a5; white-space: pre-wrap; flex: 1; font-size: 12px; }
details summary { cursor: pointer; color: #d4d4d8; }
@media (max-width: 560px) { label.row { grid-template-columns: 1fr; } }
`;

