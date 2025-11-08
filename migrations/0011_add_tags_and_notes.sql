-- Migration: Add Tags and Notes Tables
-- Purpose: Phase 4-3 - タグ・メモ機能実装
-- Date: 2025-11-08

-- ============================================================
-- タグテーブル（Tags）
-- ============================================================
-- ユーザーが作成するカスタムタグ（例: "要検討", "お気に入り", "高利回り"）
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,                         -- タグID（例: "tag-uuid"）
    name TEXT NOT NULL UNIQUE,                   -- タグ名（一意、例: "要検討"）
    color TEXT NOT NULL DEFAULT '#3B82F6',       -- 色コード（例: "#3B82F6" = Blue）
    user_id TEXT NOT NULL,                       -- 作成ユーザーID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 物件タグジャンクションテーブル（Property Tags）
-- ============================================================
-- 物件とタグの多対多リレーション
CREATE TABLE IF NOT EXISTS property_tags (
    property_id TEXT NOT NULL,                   -- 物件ID
    tag_id TEXT NOT NULL,                        -- タグID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (property_id, tag_id),
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- ============================================================
-- メモテーブル（Notes）
-- ============================================================
-- 物件ごとのメモ・ノート
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,                         -- メモID（例: "note-uuid"）
    property_id TEXT NOT NULL,                   -- 物件ID
    user_id TEXT NOT NULL,                       -- 作成ユーザーID
    content TEXT NOT NULL,                       -- メモ内容（Markdown対応）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- インデックス作成
-- ============================================================
-- タグテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- 物件タグジャンクションテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_property_tags_property_id ON property_tags(property_id);
CREATE INDEX IF NOT EXISTS idx_property_tags_tag_id ON property_tags(tag_id);

-- メモテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_notes_property_id ON notes(property_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);

-- ============================================================
-- デフォルトタグの作成（オプション）
-- ============================================================
-- 運営管理者用のデフォルトタグを作成
INSERT OR IGNORE INTO tags (id, name, color, user_id) VALUES
    ('tag-favorite', 'お気に入り', '#EF4444', 'user-000'),      -- 赤色
    ('tag-high-yield', '高利回り', '#10B981', 'user-000'),     -- 緑色
    ('tag-under-review', '要検討', '#F59E0B', 'user-000'),     -- オレンジ色
    ('tag-archived', 'アーカイブ', '#6B7280', 'user-000');      -- グレー色

-- ============================================================
-- マイグレーション完了
-- ============================================================
-- Phase 4-3 - Tags and Notes Tables created successfully
