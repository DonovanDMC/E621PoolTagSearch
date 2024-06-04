export interface Pool {
    category: "series" | "collection";
    created_at: string;
    creator_id: number;
    description: string;
    id: number;
    is_active: boolean;
    name: string;
    post_ids: Array<number>;
    tag_string: string;
    updated_at: string;
}

export interface PoolResponse {
    pools: Array<Pool>;
    total: number;
}

export interface CurrentUser {
    api_burst_limit: number;
    api_regen_multiplier: number;
    avatar_id: number;
    base_upload_limit: number;
    blacklist_users: boolean;
    blacklisted_tags: string;
    can_approve_posts: boolean;
    can_upload_free: boolean;
    comment_threshold: number;
    created_at: string;
    custom_style: string;
    default_image_size: string;
    description_collapsed_initially: boolean;
    disable_cropped_thumbnails: boolean;
    disable_responsive_mode: boolean;
    disable_user_dmails: boolean;
    email: string;
    enable_auto_complete: boolean;
    enable_compact_uploader: boolean;
    enable_keyboard_navigation: boolean;
    enable_privacy_mode: boolean;
    enable_safe_mode: boolean;
    favorite_count: number;
    favorite_limit: number;
    favorite_tags: string;
    has_mail: boolean;
    hide_comments: boolean;
    id: number;
    is_banned: boolean;
    last_forum_read_at: string;
    last_logged_in_at: string;
    level: number;
    level_string: string;
    name: string;
    no_flagging: boolean;
    note_update_count: number;
    per_page: number;
    post_update_count: number;
    post_upload_count: number;
    receive_email_notifications: boolean;
    recent_tags: string;
    remaining_api_limit: number;
    replacements_beta: boolean;
    show_hidden_comments: boolean;
    show_post_statistics: boolean;
    statement_timeout: number;
    style_usernames: boolean;
    tag_query_limit: number;
    time_zone: string;
    updated_at: string;
}

export interface ErrorResponse {
    code: string | null;
    message: string;
    success: false;
}

declare global {
    interface Danbooru {
        error(message: string): void;
        notice(message: string): void;
    }
    const Danbooru: Danbooru;
}
