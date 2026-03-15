/**
 * Global TOML configuration injected at build time
 */

declare const __MARKIFY_TEMPLATES__: any;
declare const __MARKIFY_THEME__: ThemeConfig;
declare const __MARKIFY_NOTIFICATIONS__: NotificationConfig;
declare const __MARKIFY_UI__: UIConfig;
declare const __MARKIFY_PACKAGE__: PackageConfig;
declare const __MARKIFY_ADAPTER_USCARDFORUM__: any;

interface ThemeConfig {
    colors: {
        primary: string;
        primary_hover: string;
        primary_active: string;
        secondary: string;
        secondary_hover: string;
        secondary_active: string;
        success: string;
        error: string;
        warning: string;
        info: string;
        background: string;
        surface: string;
        text_primary: string;
        text_secondary: string;
        text_muted: string;
        overlay_alpha: number;
        shadow_alpha: number;
        shadow_alpha_hover: number;
    };
}

interface NotificationConfig {
    messages: {
        clipboard_success: string;
        download_success: string;
        settings_saved: string;
        settings_reset: string;
        history_cleared: string;
        stats_reset: string;
        api_fetching: string;
        downloading: string;
        processing: string;
        conversion_failed: string;
        download_failed: string;
        no_files: string;
        batch_partial: string;
        batch_complete: string;
        stats_summary: string;
        clear_history_confirm: string;
    };
    timeouts: {
        short: number;
        medium: number;
        long: number;
    };
    delays: {
        cleanup: number;
        batch_item: number;
        dom_stabilize: number;
        rate_limit: number;
    };
}

interface UIConfig {
    ui: {
        button_color: string;
        button_hover_color: string;
        button_offset_x: number;
        button_offset_y: number;
        button_position: string;
        button_text: string;
        buttons: {
            download_text: string;
            download_color: string;
            download_hover_color: string;
            copy_text: string;
            copy_color: string;
            copy_hover_color: string;
            gap: string;
        };
        indicators: {
            downloaded_icon: string;
            downloaded_color: string;
            downloaded_tooltip: string;
            font_size: string;
            font_size_title: string;
        };
        position: {
            default_top: string;
            default_right: string;
            z_index: number;
        };
        style: {
            padding: string;
            border_radius: string;
            font_size: string;
            font_weight: string;
            font_family: string;
        };
        shadows: {
            button_default: string;
            button_hover: string;
            copy_default: string;
            copy_hover: string;
        };
        animations: {
            hover_transform: string;
            transition: string;
        };
    };
    filename: {
        single: string;
        batch: string;
    };
    conversion: {
        code_block_style: string;
        em_delimiter: string;
        heading_style: string;
        link_style: string;
        strong_delimiter: string;
        remove_elements: {
            tags: string[];
        };
        content_selectors: {
            selectors: string[];
        };
    };
    frontmatter: {
        default_tags: string[];
        include_author: boolean;
        include_date: boolean;
        include_downloaded: boolean;
        include_tags: boolean;
        include_title: boolean;
        include_url: boolean;
    };
}

interface PackageConfig {
    package: {
        author: string;
        description: string;
        name: string;
        repository: string;
        version: string;
        strings: {
            app_title: string;
            app_title_batch: string;
            app_title_error: string;
            app_title_stats: string;
        };
        menu: {
            settings: string;
            stats: string;
            history: string;
            clear_history: string;
            reset_stats: string;
        };
    };
}
