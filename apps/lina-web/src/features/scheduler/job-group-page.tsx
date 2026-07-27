import Button from "@douyinfe/semi-ui/lib/es/button";
import Card from "@douyinfe/semi-ui/lib/es/card";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import Popconfirm from "@douyinfe/semi-ui/lib/es/popconfirm";
import SideSheet from "@douyinfe/semi-ui/lib/es/sideSheet";
import Space from "@douyinfe/semi-ui/lib/es/space";
import Table from "@douyinfe/semi-ui/lib/es/table";
import type { ColumnProps } from "@douyinfe/semi-ui/lib/es/table/interface";
import Tag from "@douyinfe/semi-ui/lib/es/tag";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import Tooltip from "@douyinfe/semi-ui/lib/es/tooltip";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { createSystemJobApi } from "#/api/system/job";
import type { JobGroup } from "#/api/system/job";
import { useWorkbenchRuntime } from "#/app/workbench-runtime-context";
import { useAuthContext } from "#/auth/auth-context";
import { MobileRecordActions, MobileRecordCard, MobileRecordField, MobileRecordFields, MobileRecordList, MobileRecordTitle } from "#/plugin-ui/mobile-record";

interface GroupFilters {
  code?: string;
  name?: string;
}

function can(permissions: readonly string[], key: string) {
  return permissions.includes("*") || permissions.includes(key);
}

export default function JobGroupPage() {
  const { apiClient } = useWorkbenchRuntime();
  const auth = useAuthContext();
  const { t } = useTranslation();
  const api = useMemo(() => createSystemJobApi(apiClient), [apiClient]);
  const permissions = auth?.user.permissions ?? [];
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<GroupFilters>({});
  const [formKey, setFormKey] = useState(0);
  const [editing, setEditing] = useState<JobGroup | "new">();
  const query = useQuery({
    queryFn: () => api.listGroups({ ...filters, pageNum: page, pageSize: 10 }),
    queryKey: ["scheduler", "groups", filters, page],
  });

  async function refresh() {
    await query.refetch();
  }

  async function save(values: Partial<JobGroup>) {
    const updating = editing !== "new" && Boolean(editing);
    if (updating) {
      await api.updateGroup((editing as JobGroup).id, values);
    } else {
      await api.createGroup(values);
    }
    Toast.success(t(updating ? "pages.common.updateSuccess" : "pages.common.createSuccess"));
    setEditing(undefined);
    await refresh();
  }

  async function remove(row: JobGroup) {
    await api.deleteGroup([row.id]);
    Toast.success(t("pages.common.deleteSuccess"));
    await refresh();
  }

  function resetSearch() {
    setFilters({});
    setFormKey((value) => value + 1);
    setPage(1);
  }

  function renderActions(row: JobGroup) {
    return (
      <Space>
        {can(permissions, "system:jobgroup:edit") ? (
          <Button data-testid={`job-group-edit-${row.id}`} onClick={() => setEditing(row)} theme="borderless">
            {t("pages.common.edit")}
          </Button>
        ) : null}
        {can(permissions, "system:jobgroup:remove") ? row.isDefault === 1 ? (
          <Tooltip content={t("pages.scheduler.group.defaultDeleteDisabled")}>
            <span><Button data-testid={`job-group-delete-${row.id}`} disabled theme="borderless" type="danger">{t("pages.common.delete")}</Button></span>
          </Tooltip>
        ) : (
          <Popconfirm content={t("pages.scheduler.group.deleteConfirm")} onConfirm={() => void remove(row)}>
            <Button data-testid={`job-group-delete-${row.id}`} theme="borderless" type="danger">{t("pages.common.delete")}</Button>
          </Popconfirm>
        ) : null}
      </Space>
    );
  }

  const columns: ColumnProps<JobGroup>[] = [
    { dataIndex: "code", title: t("pages.scheduler.group.code") },
    { dataIndex: "name", title: t("pages.scheduler.group.name") },
    { dataIndex: "sortOrder", title: t("pages.scheduler.group.sortOrder") },
    { dataIndex: "jobCount", title: t("pages.scheduler.group.jobs") },
    {
      dataIndex: "isDefault",
      render: (value) => value === 1 ? <Tag color="amber">{t("pages.scheduler.group.default")}</Tag> : "-",
      title: t("pages.scheduler.group.default"),
    },
    { dataIndex: "remark", title: t("pages.common.remark") },
    {
      fixed: "right",
      render: (_, row) => renderActions(row),
      title: t("pages.common.actions"),
      width: 160,
    },
  ];

  return (
    <section className="feature-page" data-testid="job-group-page">
      <Typography.Title heading={3}>{t("pages.scheduler.group.title")}</Typography.Title>
      <Card>
        <Form<GroupFilters>
          className="iam-search-form"
          id="job-group-filter-form"
          key={formKey}
          layout="horizontal"
          onSubmit={(values) => { setFilters(values); setPage(1); }}
        >
          <Form.Input field="code" id="job-group-filter-code" label={t("pages.scheduler.group.code")} />
          <Form.Input field="name" id="job-group-filter-name" label={t("pages.scheduler.group.name")} />
          <Button htmlType="reset" onClick={resetSearch}>{t("pages.common.reset")}</Button>
          <Button htmlType="submit" theme="solid" type="primary">{t("pages.common.search")}</Button>
        </Form>
      </Card>
      <Card>
        <div className="iam-toolbar">
          {can(permissions, "system:jobgroup:add") ? (
            <Button data-testid="job-group-add" onClick={() => setEditing("new")} theme="solid" type="primary">
              {t("pages.common.add")}
            </Button>
          ) : null}
        </div>
        <div className="responsive-desktop-table" data-testid="job-group-table">
          <Table<JobGroup>
            columns={columns}
            dataSource={query.data?.list ?? []}
            pagination={{ currentPage: page, onChange: setPage, pageSize: 10, total: query.data?.total ?? 0 }}
            rowKey="id"
          />
        </div>
        <MobileRecordList testId="job-group-mobile-list">
          {(query.data?.list ?? []).map((row) => (
            <MobileRecordCard key={row.id} testId={`job-group-mobile-card-${row.id}`}>
              <MobileRecordTitle>{row.name}</MobileRecordTitle>
              <MobileRecordFields>
                <MobileRecordField label={t("pages.scheduler.group.code")} value={row.code} />
                <MobileRecordField label={t("pages.scheduler.group.jobs")} value={row.jobCount} />
                <MobileRecordField label={t("pages.scheduler.group.default")} value={row.isDefault === 1 ? t("pages.common.yes") : t("pages.common.no")} />
              </MobileRecordFields>
              <MobileRecordActions>{renderActions(row)}</MobileRecordActions>
            </MobileRecordCard>
          ))}
        </MobileRecordList>
      </Card>
      <SideSheet
        onCancel={() => setEditing(undefined)}
        title={t(editing === "new" ? "pages.scheduler.group.create" : "pages.scheduler.group.edit")}
        visible={editing !== undefined}
        width="min(448px, 100vw)"
      >
        <Form<Partial<JobGroup>>
          initValues={editing === "new" ? { sortOrder: 0 } : editing}
          key={editing === "new" ? "new" : editing?.id}
          labelPosition="top"
          onSubmit={save}
        >
          <Form.Input field="code" label={t("pages.scheduler.group.code")} rules={[{ required: true, message: t("pages.settings.required") }]} />
          <Form.Input field="name" label={t("pages.scheduler.group.name")} rules={[{ required: true, message: t("pages.settings.required") }]} />
          <Form.InputNumber field="sortOrder" label={t("pages.scheduler.group.sortOrder")} />
          <Form.TextArea field="remark" label={t("pages.common.remark")} />
          <div className="iam-form-actions">
            <Button onClick={() => setEditing(undefined)}>{t("pages.common.cancel")}</Button>
            <Button htmlType="submit" theme="solid" type="primary">{t("pages.common.confirm")}</Button>
          </div>
        </Form>
      </SideSheet>
    </section>
  );
}
