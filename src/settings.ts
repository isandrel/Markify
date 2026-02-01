/**
 * Markify Settings Interface
 */
import { theme, notifications, pkg, ui } from './config';
export interface MarkifySettings {
  // UI Settings
  buttonPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  buttonText: string;
  buttonColor: string;

  // Conversion Settings
  includeImages: boolean;
  includeTables: boolean;
  includeCodeBlocks: boolean;

  // Frontmatter Settings
  includeTitle: boolean;
  includeUrl: boolean;
  includeDate: boolean;
  includeAuthor: boolean;
  includeTags: boolean;
  customTags: string[];

  // Advanced Settings
  enabledAdapters: string[];
  customCSS: string;
}

/**
 * Default settings
 */
export const defaultSettings: MarkifySettings = {
  // UI Settings
  buttonPosition: 'bottom-right',
  buttonText: ui.ui.button_text,
  buttonColor: theme.colors.primary,

  // Conversion Settings
  includeImages: true,
  includeTables: true,
  includeCodeBlocks: true,

  // Frontmatter Settings
  includeTitle: true,
  includeUrl: true,
  includeDate: true,
  includeAuthor: true,
  includeTags: true,
  customTags: [],

  // Advanced Settings
  enabledAdapters: ['all'],
  customCSS: '',
};

/**
 * Load settings from GM storage
 */
export async function loadSettings(): Promise<MarkifySettings> {
  const stored = await GM.getValue('markify_settings', null);
  if (!stored) {
    return defaultSettings;
  }

  try {
    const parsed = JSON.parse(stored as string);
    return { ...defaultSettings, ...parsed };
  } catch {
    return defaultSettings;
  }
}

/**
 * Save settings to GM storage
 */
export async function saveSettings(settings: MarkifySettings): Promise<void> {
  await GM.setValue('markify_settings', JSON.stringify(settings));
  GM.notification({
    text: notifications.messages.settings_saved,
    title: pkg.package.strings.app_title,
    timeout: notifications.timeouts.short,
  });
}

/**
 * Reset settings to default
 */
export async function resetSettings(): Promise<void> {
  await GM.deleteValue('markify_settings');
  GM.notification({
    text: notifications.messages.settings_reset,
    title: pkg.package.strings.app_title,
    timeout: notifications.timeouts.short,
  });
}

/**
 * Create settings UI
 */
export function createSettingsUI(): HTMLElement {
  const container = document.createElement('div');
  container.id = 'markify-settings';

  container.innerHTML = `
    <style>
      #markify-settings-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        backdrop-filter: blur(4px);
      }
      
      #markify-settings-panel {
        background: #1a1a1a;
        border-radius: 16px;
        padding: 32px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        color: #fff;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      
      #markify-settings-panel h2 {
        margin: 0 0 24px 0;
        font-size: 24px;
        font-weight: 700;
        color: ${theme.colors.primary};
      }
      
      .markify-setting-group {
        margin-bottom: 24px;
      }
      
      .markify-setting-group h3 {
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 12px 0;
        color: ${theme.colors.text_secondary};
      }
      
      .markify-setting-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #333;
      }
      
      .markify-setting-item:last-child {
        border-bottom: none;
      }
      
      .markify-setting-item label {
        font-size: 14px;
        color: ${theme.colors.text_primary};
      }
      
      .markify-setting-item input[type="checkbox"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
      }
      
      .markify-setting-item select,
      .markify-setting-item input[type="text"] {
        padding: 8px 12px;
        border-radius: 6px;
        border: 1px solid #444;
        background: #2a2a2a;
        color: #fff;
        font-size: 14px;
      }
      
      .markify-buttons {
        display: flex;
        gap: 12px;
        margin-top: 24px;
      }
      
      .markify-btn {
        flex: 1;
        padding: 12px 24px;
        border-radius: 8px;
        border: none;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .markify-btn-primary {
        background: ${theme.colors.primary};
        color: white;
      }
      
      .markify-btn-primary:hover {
        background: ${theme.colors.primary_hover};
      }
      
      .markify-btn-secondary {
        background: #374151;
        color: white;
      }
      
      .markify-btn-secondary:hover {
        background: #4b5563;
      }
    </style>
    
    <div id="markify-settings-overlay">
      <div id="markify-settings-panel">
        <h2>⚙️ Markify Settings</h2>
        
        <div class="markify-setting-group">
          <h3>UI Settings</h3>
          <div class="markify-setting-item">
            <label>Button Position</label>
            <select id="button-position">
              <option value="top-left">Top Left</option>
              <option value="top-right">Top Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-right" selected>Bottom Right</option>
            </select>
          </div>
          <div class="markify-setting-item">
            <label>Button Text</label>
            <input type="text" id="button-text" value="📥 Markify" />
          </div>
        </div>
        
        <div class="markify-setting-group">
          <h3>Frontmatter</h3>
          <div class="markify-setting-item">
            <label>Include Title</label>
            <input type="checkbox" id="include-title" checked />
          </div>
          <div class="markify-setting-item">
            <label>Include URL</label>
            <input type="checkbox" id="include-url" checked />
          </div>
          <div class="markify-setting-item">
            <label>Include Date</label>
            <input type="checkbox" id="include-date" checked />
          </div>
          <div class="markify-setting-item">
            <label>Include Author</label>
            <input type="checkbox" id="include-author" checked />
          </div>
          <div class="markify-setting-item">
            <label>Include Tags</label>
            <input type="checkbox" id="include-tags" checked />
          </div>
        </div>
        
        <div class="markify-setting-group">
          <h3>Content Options</h3>
          <div class="markify-setting-item">
            <label>Include Images</label>
            <input type="checkbox" id="include-images" checked />
          </div>
          <div class="markify-setting-item">
            <label>Include Tables</label>
            <input type="checkbox" id="include-tables" checked />
          </div>
          <div class="markify-setting-item">
            <label>Include Code Blocks</label>
            <input type="checkbox" id="include-code" checked />
          </div>
        </div>
        
        <div class="markify-buttons">
          <button class="markify-btn markify-btn-secondary" id="markify-close">Cancel</button>
          <button class="markify-btn markify-btn-secondary" id="markify-reset">Reset to Defaults</button>
          <button class="markify-btn markify-btn-primary" id="markify-save">Save Settings</button>
        </div>
      </div>
    </div>
  `;

  return container;
}

/**
 * Show settings dialog
 */
export async function showSettings(): Promise<void> {
  const settings = await loadSettings();
  const ui = createSettingsUI();
  document.body.appendChild(ui);

  // Populate fields
  const btnPos = ui.querySelector('#button-position') as HTMLSelectElement;
  const btnText = ui.querySelector('#button-text') as HTMLInputElement;
  const includeTitle = ui.querySelector('#include-title') as HTMLInputElement;
  const includeUrl = ui.querySelector('#include-url') as HTMLInputElement;
  const includeDate = ui.querySelector('#include-date') as HTMLInputElement;
  const includeAuthor = ui.querySelector('#include-author') as HTMLInputElement;
  const includeTags = ui.querySelector('#include-tags') as HTMLInputElement;
  const includeImages = ui.querySelector('#include-images') as HTMLInputElement;
  const includeTables = ui.querySelector('#include-tables') as HTMLInputElement;
  const includeCode = ui.querySelector('#include-code') as HTMLInputElement;

  btnPos.value = settings.buttonPosition;
  btnText.value = settings.buttonText;
  includeTitle.checked = settings.includeTitle;
  includeUrl.checked = settings.includeUrl;
  includeDate.checked = settings.includeDate;
  includeAuthor.checked = settings.includeAuthor;
  includeTags.checked = settings.includeTags;
  includeImages.checked = settings.includeImages;
  includeTables.checked = settings.includeTables;
  includeCode.checked = settings.includeCodeBlocks;

  // Event handlers
  ui.querySelector('#markify-close')?.addEventListener('click', () => {
    ui.remove();
  });

  ui.querySelector('#markify-reset')?.addEventListener('click', async () => {
    await resetSettings();
    ui.remove();
    window.location.reload();
  });

  ui.querySelector('#markify-save')?.addEventListener('click', async () => {
    const newSettings: MarkifySettings = {
      ...settings,
      buttonPosition: btnPos.value as any,
      buttonText: btnText.value,
      includeTitle: includeTitle.checked,
      includeUrl: includeUrl.checked,
      includeDate: includeDate.checked,
      includeAuthor: includeAuthor.checked,
      includeTags: includeTags.checked,
      includeImages: includeImages.checked,
      includeTables: includeTables.checked,
      includeCodeBlocks: includeCode.checked,
    };

    await saveSettings(newSettings);
    ui.remove();
    window.location.reload();
  });

  // Close on overlay click
  ui.querySelector('#markify-settings-overlay')?.addEventListener('click', (e) => {
    if (e.target === ui.querySelector('#markify-settings-overlay')) {
      ui.remove();
    }
  });
}
