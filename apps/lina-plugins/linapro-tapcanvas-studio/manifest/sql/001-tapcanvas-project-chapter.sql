-- ------------------------------------------------------------
-- 001 TapCanvas project and chapter SQL file
-- 001 TapCanvas 项目与章节 SQL 文件
-- Purpose: Stores tenant-scoped project and chapter truth for TapCanvas Studio.
-- 用途：存储 TapCanvas Studio 按租户隔离的项目与章节真源。
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tapcanvas_projects (
    "id"          VARCHAR(36) PRIMARY KEY,
    "tenant_id"   BIGINT NOT NULL,
    "owner_id"    BIGINT NOT NULL,
    "name"        VARCHAR(200) NOT NULL,
    "description" VARCHAR(1000) NOT NULL DEFAULT '',
    "created_at"  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "deleted_at"  TIMESTAMPTZ
);

COMMENT ON TABLE tapcanvas_projects IS 'TapCanvas tenant project table';
COMMENT ON COLUMN tapcanvas_projects."id" IS 'Server-generated project ID';
COMMENT ON COLUMN tapcanvas_projects."tenant_id" IS 'Owning LinaPro tenant ID';
COMMENT ON COLUMN tapcanvas_projects."owner_id" IS 'Owning LinaPro user ID used by data scope';
COMMENT ON COLUMN tapcanvas_projects."name" IS 'Project name';
COMMENT ON COLUMN tapcanvas_projects."description" IS 'Project description';
COMMENT ON COLUMN tapcanvas_projects."created_at" IS 'Creation time';
COMMENT ON COLUMN tapcanvas_projects."updated_at" IS 'Last update time';
COMMENT ON COLUMN tapcanvas_projects."deleted_at" IS 'Soft deletion time';

CREATE UNIQUE INDEX IF NOT EXISTS uk_tapcanvas_projects_tenant_id ON tapcanvas_projects ("tenant_id", "id");
CREATE INDEX IF NOT EXISTS idx_tapcanvas_projects_tenant_updated ON tapcanvas_projects ("tenant_id", "deleted_at", "updated_at" DESC);
CREATE INDEX IF NOT EXISTS idx_tapcanvas_projects_tenant_owner_updated ON tapcanvas_projects ("tenant_id", "owner_id", "deleted_at", "updated_at" DESC);

CREATE TABLE IF NOT EXISTS tapcanvas_chapters (
    "id"             VARCHAR(36) PRIMARY KEY,
    "tenant_id"      BIGINT NOT NULL,
    "project_id"     VARCHAR(36) NOT NULL,
    "owner_id"       BIGINT NOT NULL,
    "chapter_index"  INT NOT NULL,
    "title"          VARCHAR(200) NOT NULL,
    "summary"        VARCHAR(5000) NOT NULL DEFAULT '',
    "status"         VARCHAR(32) NOT NULL DEFAULT 'draft',
    "sort_order"     INT NOT NULL,
    "last_worked_at" TIMESTAMPTZ,
    "created_at"     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at"     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "deleted_at"     TIMESTAMPTZ,
    CONSTRAINT fk_tapcanvas_chapters_project
        FOREIGN KEY ("tenant_id", "project_id")
        REFERENCES tapcanvas_projects ("tenant_id", "id")
        ON DELETE RESTRICT
);

COMMENT ON TABLE tapcanvas_chapters IS 'TapCanvas tenant project chapter table';
COMMENT ON COLUMN tapcanvas_chapters."id" IS 'Server-generated chapter ID';
COMMENT ON COLUMN tapcanvas_chapters."tenant_id" IS 'Owning LinaPro tenant ID';
COMMENT ON COLUMN tapcanvas_chapters."project_id" IS 'Owning visible project ID';
COMMENT ON COLUMN tapcanvas_chapters."owner_id" IS 'Creating LinaPro user ID used for audit projection';
COMMENT ON COLUMN tapcanvas_chapters."chapter_index" IS 'Stable one-based chapter index inside the project';
COMMENT ON COLUMN tapcanvas_chapters."title" IS 'Chapter title';
COMMENT ON COLUMN tapcanvas_chapters."summary" IS 'Chapter summary';
COMMENT ON COLUMN tapcanvas_chapters."status" IS 'Chapter workflow status from tapcanvas_chapter_status';
COMMENT ON COLUMN tapcanvas_chapters."sort_order" IS 'Project-local display order';
COMMENT ON COLUMN tapcanvas_chapters."last_worked_at" IS 'Last time the chapter was opened for work';
COMMENT ON COLUMN tapcanvas_chapters."created_at" IS 'Creation time';
COMMENT ON COLUMN tapcanvas_chapters."updated_at" IS 'Last update time';
COMMENT ON COLUMN tapcanvas_chapters."deleted_at" IS 'Soft deletion time';

CREATE UNIQUE INDEX IF NOT EXISTS uk_tapcanvas_chapters_project_index ON tapcanvas_chapters ("tenant_id", "project_id", "chapter_index");
CREATE INDEX IF NOT EXISTS idx_tapcanvas_chapters_project_sort ON tapcanvas_chapters ("tenant_id", "project_id", "deleted_at", "sort_order", "id");
CREATE INDEX IF NOT EXISTS idx_tapcanvas_chapters_tenant_owner ON tapcanvas_chapters ("tenant_id", "owner_id", "deleted_at");

INSERT INTO sys_dict_type ("name", "type", "status", "is_builtin", "remark", "created_at", "updated_at")
VALUES ('TapCanvas Chapter Status', 'tapcanvas_chapter_status', 1, 1, 'TapCanvas chapter workflow status options', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

INSERT INTO sys_dict_data ("dict_type", "label", "value", "sort", "tag_style", "status", "is_builtin", "created_at", "updated_at")
VALUES
    ('tapcanvas_chapter_status', 'Draft', 'draft', 1, 'default', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tapcanvas_chapter_status', 'Planning', 'planning', 2, 'primary', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tapcanvas_chapter_status', 'Producing', 'producing', 3, 'warning', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tapcanvas_chapter_status', 'Review', 'review', 4, 'tertiary', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tapcanvas_chapter_status', 'Approved', 'approved', 5, 'success', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tapcanvas_chapter_status', 'Locked', 'locked', 6, 'danger', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tapcanvas_chapter_status', 'Archived', 'archived', 7, 'grey', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
