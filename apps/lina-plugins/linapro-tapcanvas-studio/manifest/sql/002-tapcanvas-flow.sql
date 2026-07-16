-- ------------------------------------------------------------
-- 002 TapCanvas Flow and FlowMutation SQL file
-- 002 TapCanvas Flow 与 FlowMutation SQL 文件
-- Purpose: Stores tenant-scoped Flow snapshots, idempotent mutations, and savepoints.
-- 用途：存储 TapCanvas Studio 按租户隔离的 Flow 快照、幂等变更与保存点。
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tapcanvas_flows (
    "id"                VARCHAR(36) PRIMARY KEY,
    "tenant_id"         BIGINT NOT NULL,
    "project_id"        VARCHAR(36) NOT NULL,
    "owner_id"          BIGINT NOT NULL,
    "owner_type"        VARCHAR(16) NOT NULL DEFAULT 'project',
    "owner_resource_id" VARCHAR(36) NOT NULL,
    "name"              VARCHAR(200) NOT NULL,
    "description"       VARCHAR(1000) NOT NULL DEFAULT '',
    "snapshot"          JSONB NOT NULL DEFAULT '{"nodes":[],"edges":[],"viewport":null}',
    "revision"          BIGINT NOT NULL DEFAULT 0,
    "created_at"        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at"        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "deleted_at"        TIMESTAMPTZ,
    CONSTRAINT ck_tapcanvas_flows_revision_nonnegative CHECK ("revision" >= 0),
    CONSTRAINT ck_tapcanvas_flows_owner_type CHECK ("owner_type" IN ('project', 'chapter')),
    CONSTRAINT fk_tapcanvas_flows_project
        FOREIGN KEY ("tenant_id", "project_id")
        REFERENCES tapcanvas_projects ("tenant_id", "id")
        ON DELETE RESTRICT
);

COMMENT ON TABLE tapcanvas_flows IS 'TapCanvas tenant Flow snapshot table';
COMMENT ON COLUMN tapcanvas_flows."id" IS 'Server-generated Flow ID';
COMMENT ON COLUMN tapcanvas_flows."tenant_id" IS 'Owning LinaPro tenant ID';
COMMENT ON COLUMN tapcanvas_flows."project_id" IS 'Visible ancestor project ID';
COMMENT ON COLUMN tapcanvas_flows."owner_id" IS 'Creating LinaPro user ID used for audit projection';
COMMENT ON COLUMN tapcanvas_flows."owner_type" IS 'Flow owner type: project or chapter';
COMMENT ON COLUMN tapcanvas_flows."owner_resource_id" IS 'Project or chapter resource ID selected by owner_type';
COMMENT ON COLUMN tapcanvas_flows."name" IS 'Flow display name';
COMMENT ON COLUMN tapcanvas_flows."description" IS 'Flow description';
COMMENT ON COLUMN tapcanvas_flows."snapshot" IS 'Current server-authoritative Flow snapshot';
COMMENT ON COLUMN tapcanvas_flows."revision" IS 'Monotonic Flow mutation revision';
COMMENT ON COLUMN tapcanvas_flows."created_at" IS 'Creation time';
COMMENT ON COLUMN tapcanvas_flows."updated_at" IS 'Last update time';
COMMENT ON COLUMN tapcanvas_flows."deleted_at" IS 'Soft deletion time';

CREATE UNIQUE INDEX IF NOT EXISTS uk_tapcanvas_flows_tenant_id ON tapcanvas_flows ("tenant_id", "id");
CREATE INDEX IF NOT EXISTS idx_tapcanvas_flows_project_updated ON tapcanvas_flows ("tenant_id", "project_id", "deleted_at", "updated_at" DESC, "id");
CREATE INDEX IF NOT EXISTS idx_tapcanvas_flows_owner_updated ON tapcanvas_flows ("tenant_id", "owner_type", "owner_resource_id", "deleted_at", "updated_at" DESC, "id");
CREATE INDEX IF NOT EXISTS idx_tapcanvas_flows_scope_updated ON tapcanvas_flows ("tenant_id", "owner_id", "deleted_at", "updated_at" DESC, "id");

CREATE TABLE IF NOT EXISTS tapcanvas_flow_mutations (
    "id"              VARCHAR(36) PRIMARY KEY,
    "tenant_id"       BIGINT NOT NULL,
    "flow_id"         VARCHAR(36) NOT NULL,
    "mutation_id"     VARCHAR(128) NOT NULL,
    "protocol_version" VARCHAR(16) NOT NULL,
    "request_digest"  CHAR(64) NOT NULL,
    "request_bytes"   INT NOT NULL,
    "base_revision"   BIGINT NOT NULL,
    "result_revision" BIGINT NOT NULL,
    "actor_type"      VARCHAR(16) NOT NULL,
    "actor_id"        VARCHAR(128) NOT NULL,
    "actor_user_id"   BIGINT,
    "operations"      JSONB NOT NULL,
    "created_at"      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_tapcanvas_flow_mutations_request_bytes CHECK ("request_bytes" > 0 AND "request_bytes" <= 1048576),
    CONSTRAINT ck_tapcanvas_flow_mutations_revision CHECK ("base_revision" >= 0 AND "result_revision" = "base_revision" + 1),
    CONSTRAINT ck_tapcanvas_flow_mutations_actor_type CHECK ("actor_type" IN ('user', 'agent')),
    CONSTRAINT fk_tapcanvas_flow_mutations_flow
        FOREIGN KEY ("tenant_id", "flow_id")
        REFERENCES tapcanvas_flows ("tenant_id", "id")
        ON DELETE RESTRICT
);

COMMENT ON TABLE tapcanvas_flow_mutations IS 'TapCanvas idempotent FlowMutation audit table';
COMMENT ON COLUMN tapcanvas_flow_mutations."id" IS 'Server-generated mutation audit row ID';
COMMENT ON COLUMN tapcanvas_flow_mutations."tenant_id" IS 'Owning LinaPro tenant ID';
COMMENT ON COLUMN tapcanvas_flow_mutations."flow_id" IS 'Mutated Flow ID';
COMMENT ON COLUMN tapcanvas_flow_mutations."mutation_id" IS 'Caller-generated idempotency key scoped to one Flow';
COMMENT ON COLUMN tapcanvas_flow_mutations."protocol_version" IS 'FlowMutation protocol version';
COMMENT ON COLUMN tapcanvas_flow_mutations."request_digest" IS 'SHA-256 digest of canonical mutation input';
COMMENT ON COLUMN tapcanvas_flow_mutations."request_bytes" IS 'Canonical request size in bytes';
COMMENT ON COLUMN tapcanvas_flow_mutations."base_revision" IS 'Revision asserted by the caller';
COMMENT ON COLUMN tapcanvas_flow_mutations."result_revision" IS 'Revision committed by this mutation';
COMMENT ON COLUMN tapcanvas_flow_mutations."actor_type" IS 'Server-derived actor type: user or agent';
COMMENT ON COLUMN tapcanvas_flow_mutations."actor_id" IS 'Server-derived user or Agent run identity';
COMMENT ON COLUMN tapcanvas_flow_mutations."actor_user_id" IS 'Current LinaPro user when available';
COMMENT ON COLUMN tapcanvas_flow_mutations."operations" IS 'Validated FlowMutation operations retained for audit';
COMMENT ON COLUMN tapcanvas_flow_mutations."created_at" IS 'Mutation commit time';

CREATE UNIQUE INDEX IF NOT EXISTS uk_tapcanvas_flow_mutations_idempotency ON tapcanvas_flow_mutations ("tenant_id", "flow_id", "mutation_id");
CREATE UNIQUE INDEX IF NOT EXISTS uk_tapcanvas_flow_mutations_revision ON tapcanvas_flow_mutations ("tenant_id", "flow_id", "result_revision");
CREATE INDEX IF NOT EXISTS idx_tapcanvas_flow_mutations_actor ON tapcanvas_flow_mutations ("tenant_id", "actor_type", "actor_id", "created_at" DESC);

CREATE TABLE IF NOT EXISTS tapcanvas_flow_versions (
    "id"            VARCHAR(36) PRIMARY KEY,
    "tenant_id"     BIGINT NOT NULL,
    "flow_id"       VARCHAR(36) NOT NULL,
    "revision"      BIGINT NOT NULL,
    "name"          VARCHAR(200) NOT NULL,
    "snapshot"      JSONB NOT NULL,
    "actor_type"    VARCHAR(16) NOT NULL,
    "actor_id"      VARCHAR(128) NOT NULL,
    "actor_user_id" BIGINT,
    "created_at"    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_tapcanvas_flow_versions_revision_nonnegative CHECK ("revision" >= 0),
    CONSTRAINT ck_tapcanvas_flow_versions_actor_type CHECK ("actor_type" IN ('user', 'agent')),
    CONSTRAINT fk_tapcanvas_flow_versions_flow
        FOREIGN KEY ("tenant_id", "flow_id")
        REFERENCES tapcanvas_flows ("tenant_id", "id")
        ON DELETE RESTRICT
);

COMMENT ON TABLE tapcanvas_flow_versions IS 'TapCanvas controlled Flow savepoint table';
COMMENT ON COLUMN tapcanvas_flow_versions."id" IS 'Server-generated savepoint ID';
COMMENT ON COLUMN tapcanvas_flow_versions."tenant_id" IS 'Owning LinaPro tenant ID';
COMMENT ON COLUMN tapcanvas_flow_versions."flow_id" IS 'Saved Flow ID';
COMMENT ON COLUMN tapcanvas_flow_versions."revision" IS 'Exact Flow revision captured by this savepoint';
COMMENT ON COLUMN tapcanvas_flow_versions."name" IS 'Savepoint display name';
COMMENT ON COLUMN tapcanvas_flow_versions."snapshot" IS 'Immutable Flow snapshot at the saved revision';
COMMENT ON COLUMN tapcanvas_flow_versions."actor_type" IS 'Server-derived actor type: user or agent';
COMMENT ON COLUMN tapcanvas_flow_versions."actor_id" IS 'Server-derived user or Agent run identity';
COMMENT ON COLUMN tapcanvas_flow_versions."actor_user_id" IS 'Current LinaPro user when available';
COMMENT ON COLUMN tapcanvas_flow_versions."created_at" IS 'Savepoint creation time';

CREATE UNIQUE INDEX IF NOT EXISTS uk_tapcanvas_flow_versions_revision ON tapcanvas_flow_versions ("tenant_id", "flow_id", "revision");
CREATE INDEX IF NOT EXISTS idx_tapcanvas_flow_versions_created ON tapcanvas_flow_versions ("tenant_id", "flow_id", "created_at" DESC, "id");

INSERT INTO sys_dict_type ("name", "type", "status", "is_builtin", "remark", "created_at", "updated_at")
VALUES
    ('TapCanvas Flow Owner Type', 'tapcanvas_flow_owner_type', 1, 1, 'TapCanvas Flow owner type options', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('TapCanvas Flow Actor Type', 'tapcanvas_flow_actor_type', 1, 1, 'TapCanvas Flow mutation actor type options', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

INSERT INTO sys_dict_data ("dict_type", "label", "value", "sort", "tag_style", "status", "is_builtin", "created_at", "updated_at")
VALUES
    ('tapcanvas_flow_owner_type', 'Project', 'project', 1, 'primary', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tapcanvas_flow_owner_type', 'Chapter', 'chapter', 2, 'tertiary', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tapcanvas_flow_actor_type', 'User', 'user', 1, 'primary', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tapcanvas_flow_actor_type', 'Agent', 'agent', 2, 'warning', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
