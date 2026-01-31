import { toast, Toaster } from 'sonner';
import { saveAs } from 'file-saver';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

/**
 * Initialize UI libraries
 * Must be called once on page load
 */
export function initUI() {
    // Inject Sonner toaster container
    const toasterContainer = document.createElement('div');
    toasterContainer.id = 'markify-toaster';
    document.body.appendChild(toasterContainer);

    // Render Toaster (Sonner manages its own DOM)
    const toasterElement = Toaster({
        position: 'bottom-right',
        theme: 'dark',
        richColors: true,
    });

    toasterContainer.appendChild(toasterElement as unknown as Node);
}

/**
 * Show toast notification
 */
export function showToast(message: string, type: 'success' | 'error' | 'info' | 'loading' = 'info') {
    switch (type) {
        case 'success':
            toast.success(message);
            break;
        case 'error':
            toast.error(message);
            break;
        case 'loading':
            toast.loading(message);
            break;
        default:
            toast(message);
    }
}

/**
 * Show promise toast (auto-updates on completion)
 */
export async function showPromiseToast<T>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string }
): Promise<T> {
    return toast.promise(promise, messages);
}

/**
 * Download file using FileSaver.js
 */
export function downloadMarkdownFile(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    saveAs(blob, filename);
}

/**
 * Add tooltip to element
 */
export function addTooltip(element: HTMLElement, content: string, placement: 'top' | 'bottom' | 'left' | 'right' = 'top') {
    tippy(element, {
        content,
        theme: 'dark',
        placement,
        arrow: true,
        animation: 'fade',
    });
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        // Modern Clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }

        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
    }
}
