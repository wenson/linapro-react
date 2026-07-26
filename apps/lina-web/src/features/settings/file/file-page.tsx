import Button from "@douyinfe/semi-ui/lib/es/button";
import Card from "@douyinfe/semi-ui/lib/es/card";
import Descriptions from "@douyinfe/semi-ui/lib/es/descriptions";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import Image from "@douyinfe/semi-ui/lib/es/image";
import Modal from "@douyinfe/semi-ui/lib/es/modal";
import Popconfirm from "@douyinfe/semi-ui/lib/es/popconfirm";
import Space from "@douyinfe/semi-ui/lib/es/space";
import Spin from "@douyinfe/semi-ui/lib/es/spin";
import Switch from "@douyinfe/semi-ui/lib/es/switch";
import Table from "@douyinfe/semi-ui/lib/es/table";
import type { ColumnProps } from "@douyinfe/semi-ui/lib/es/table/interface";
import Tag from "@douyinfe/semi-ui/lib/es/tag";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import Tooltip from "@douyinfe/semi-ui/lib/es/tooltip";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  createSystemFileApi,
  type FileInfo,
  type FileListParams,
} from "#/api/system/file";
import { useWorkbenchRuntime } from "#/app/workbench-runtime-context";
import { useAuthContext } from "#/auth/auth-context";
import { downloadBlob } from "#/features/iam/download";
import { ManagedUpload } from "#/features/settings/file/managed-upload";
import { MobileRecordActions, MobileRecordCard, MobileRecordField, MobileRecordFields, MobileRecordList, MobileRecordTitle } from "#/plugin-ui/mobile-record";
import { formatTimestamp } from "#/shared/format";

const imageSuffixes = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg"]);

function formatSize(bytes: number) {
  if (!bytes) return "0 B";
  const unit = Math.min(3, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** unit).toFixed(2)} ${["B", "KB", "MB", "GB"][unit]}`;
}

function allowed(permissions: readonly string[], key: string) {
  return permissions.includes("*") || permissions.includes(key);
}

export default function FilePage() {
  const { apiClient } = useWorkbenchRuntime();
  const auth = useAuthContext();
  const { i18n, t } = useTranslation();
  const api = useMemo(() => createSystemFileApi(apiClient), [apiClient]);
  const permissions = auth?.user.permissions ?? [];
  const [params, setParams] = useState<FileListParams>({ pageNum: 1, pageSize: 10 });
  const [formKey, setFormKey] = useState(0);
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const [selected, setSelected] = useState<number[]>([]);
  const [upload, setUpload] = useState<"file" | "image">();
  const [detailId, setDetailId] = useState<number>();
  const [downloadingId, setDownloadingId] = useState<number>();

  const list = useQuery({
    queryFn: () => api.list(params),
    queryKey: ["settings", "files", params],
  });
  const options = useQuery({
    queryFn: async () => ({
      scenes: await api.scenes(),
      suffixes: await api.suffixes(),
    }),
    queryKey: ["settings", "file-options"],
  });
  const detail = useQuery({
    enabled: typeof detailId === "number",
    queryFn: () => api.detail(detailId as number),
    queryKey: ["settings", "file-detail", detailId],
  });

  async function refresh() {
    setSelected([]);
    await list.refetch();
  }

  async function remove(ids: number[]) {
    await api.delete(ids);
    Toast.success(t("pages.common.deleteSuccess"));
    await refresh();
  }

  async function download(row: FileInfo) {
    setDownloadingId(row.id);
    try {
      const direct = await api.directDownload(row.id);
      const access = direct.access;
      if (access?.mode === "presigned_url" && access.url) {
        window.location.assign(access.url);
        return;
      }
      if (access?.mode === "proxy" && direct.proxyUrl) {
        downloadBlob(await api.downloadUrl(direct.proxyUrl), row.original);
        return;
      }
      downloadBlob(await api.download(row.id), row.original);
    } catch {
      try {
        downloadBlob(await api.download(row.id), row.original);
        Toast.info(t("pages.settings.file.downloadFallback"));
      } catch {
        Toast.error(t("pages.settings.file.downloadFailed"));
      }
    } finally {
      setDownloadingId(undefined);
    }
  }

  function resetSearch() {
    setParams((current) => ({ pageNum: 1, pageSize: current.pageSize }));
    setFormKey((value) => value + 1);
  }

  function confirmSelectedDelete() {
    Modal.confirm({
      content: t("pages.settings.file.deleteSelectedConfirm", { count: selected.length }),
      onOk: () => remove(selected),
      title: t("pages.common.confirmTitle"),
    });
  }

  function renderPreview(url: string, row: FileInfo) {
    const suffix = row.suffix.toLowerCase();
    if (previewEnabled && imageSuffixes.has(suffix)) {
      return (
        <Image
          data-testid={`file-image-preview-${row.id}`}
          height={48}
          src={url}
          width={48}
        />
      );
    }
    if (previewEnabled && suffix === "pdf") {
      return (
        <Button
          data-testid={`file-pdf-preview-${row.id}`}
          onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
          theme="borderless"
        >
          {t("pages.settings.file.pdfPreview")}
        </Button>
      );
    }
    return (
      <Typography.Text
        data-testid={`file-url-${row.id}`}
        ellipsis={{ showTooltip: true }}
      >
        {url}
      </Typography.Text>
    );
  }

  const columns: ColumnProps<FileInfo>[] = [
    {
      dataIndex: "original",
      ellipsis: true,
      render: (value, row) => (
        <Typography.Text data-testid={`file-original-${row.id}`} ellipsis={{ showTooltip: true }}>
          {String(value)}
        </Typography.Text>
      ),
      title: t("pages.settings.file.original"),
      width: 190,
    },
    {
      dataIndex: "suffix",
      render: (value, row) => <span data-testid={`file-suffix-${row.id}`}>{String(value)}</span>,
      title: t("pages.settings.file.suffix"),
      width: 100,
    },
    {
      dataIndex: "scene",
      render: (value, row) => (
        <Tag data-testid={`file-scene-${row.id}`}>
          {options.data?.scenes.find((item) => item.value === value)?.label ?? String(value)}
        </Tag>
      ),
      title: t("pages.settings.file.scene"),
      width: 140,
    },
    {
      dataIndex: "url",
      render: (value, row) => renderPreview(String(value), row),
      title: t("pages.settings.file.preview"),
      width: 180,
    },
    {
      dataIndex: "size",
      render: (value, row) => (
        <span data-testid={`file-size-${row.id}`}>{formatSize(Number(value))}</span>
      ),
      sorter: true,
      title: t("pages.settings.file.size"),
      width: 120,
    },
    {
      dataIndex: "createdAt",
      render: (value, row) => (
        <span data-testid={`file-created-at-${row.id}`}>
          {formatTimestamp(value as number | null, i18n.resolvedLanguage || "en-US")}
        </span>
      ),
      sorter: true,
      title: t("pages.settings.file.uploadedAt"),
      width: 180,
    },
    {
      dataIndex: "createdByName",
      render: (value, row) => (
        <span data-testid={`file-uploader-${row.id}`}>{String(value || "-")}</span>
      ),
      title: t("pages.settings.file.uploader"),
      width: 120,
    },
    {
      render: (_, row) => (
        <Space>
          <Button
            data-testid={`file-detail-${row.id}`}
            onClick={() => setDetailId(row.id)}
            theme="borderless"
          >
            {t("pages.settings.file.detail")}
          </Button>
          {allowed(permissions, "system:file:download") ? (
            <Button
              data-testid={`file-download-${row.id}`}
              loading={downloadingId === row.id}
              onClick={() => void download(row)}
              theme="borderless"
            >
              {t("pages.settings.file.download")}
            </Button>
          ) : null}
          {allowed(permissions, "system:file:remove") ? (
            <Popconfirm
              content={t("pages.settings.deleteConfirm")}
              onConfirm={() => void remove([row.id])}
            >
              <Button
                data-testid={`file-delete-${row.id}`}
                theme="borderless"
                type="danger"
              >
                {t("pages.common.delete")}
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      ),
      title: t("pages.common.actions"),
      width: 240,
    },
  ];

  const detailData = detail.data
    ? [
        { key: t("pages.settings.file.id"), value: String(detail.data.id) },
        { key: t("pages.settings.file.original"), value: detail.data.original },
        { key: t("pages.settings.file.storedName"), value: detail.data.name },
        { key: t("pages.settings.file.suffix"), value: detail.data.suffix },
        { key: t("pages.settings.file.size"), value: formatSize(detail.data.size) },
        { key: t("pages.settings.file.scene"), value: detail.data.sceneLabel },
        { key: t("pages.settings.file.url"), value: detail.data.url },
        { key: t("pages.settings.file.uploader"), value: detail.data.createdByName || "-" },
        {
          key: t("pages.settings.file.uploadedAt"),
          value: formatTimestamp(detail.data.createdAt, i18n.resolvedLanguage || "en-US"),
        },
      ]
    : [];

  return (
    <section className="feature-page" data-testid="file-page">
      <Typography.Title heading={3}>{t("pages.settings.file.title")}</Typography.Title>
      {list.isError ? (
        <div role="alert">
          <Typography.Text type="danger">{t("pages.common.loadFailed")}</Typography.Text>
          {list.error.message ? <Typography.Text type="tertiary">{list.error.message}</Typography.Text> : null}
          <Button onClick={() => void list.refetch()}>{t("fallback.retry")}</Button>
        </div>
      ) : null}
      <Card>
        <Form<FileListParams>
          className="iam-search-form"
          key={formKey}
          layout="horizontal"
          onSubmit={(values) => setParams((current) => ({ ...current, ...values, pageNum: 1 }))}
        >
          <Form.Input field="name" label={t("pages.settings.file.name")} />
          <Form.Input field="original" label={t("pages.settings.file.original")} />
          <Form.Select
            field="suffix"
            label={t("pages.settings.file.suffix")}
            optionList={options.data?.suffixes ?? []}
          />
          <Form.Select
            field="scene"
            label={t("pages.settings.file.scene")}
            optionList={options.data?.scenes ?? []}
          />
          <Button htmlType="reset" onClick={resetSearch}>{t("pages.common.reset")}</Button>
          <Button htmlType="submit" theme="solid" type="primary">{t("pages.common.search")}</Button>
        </Form>
      </Card>
      <Card title={t("pages.settings.file.list")}>
        <div className="iam-toolbar">
          <Space>
            <Tooltip content={t("pages.settings.file.previewImages")}>
              <span className="file-preview-control">
                <span id="file-preview-switch-label">{t("pages.settings.file.previewImages")}</span>
              <Switch
                aria-label={t("pages.settings.file.previewImages")}
                aria-labelledby="file-preview-switch-label"
                checked={previewEnabled}
                data-testid="file-preview-switch"
                onChange={setPreviewEnabled}
              />
              </span>
            </Tooltip>
            {allowed(permissions, "system:file:remove") ? (
              <Button
                disabled={!selected.length}
                onClick={confirmSelectedDelete}
                type="danger"
              >
                {t("pages.common.delete")}
              </Button>
            ) : null}
            {allowed(permissions, "system:file:upload") ? (
              <>
                <Button onClick={() => setUpload("file")}>{t("pages.settings.file.upload")}</Button>
                <Button onClick={() => setUpload("image")}>{t("pages.settings.file.uploadImage")}</Button>
              </>
            ) : null}
          </Space>
        </div>
        <div className="responsive-desktop-table" data-testid="file-table">
          {list.isError ? null : list.isPending ? <div aria-live="polite" aria-label={t("pages.common.loading")} role="status"><Spin /></div> : <Table<FileInfo>
            columns={columns}
            dataSource={list.data?.list ?? []}
            onChange={({ pagination, sorter }) => setParams((current) => ({
              ...current,
              orderBy: sorter?.dataIndex ? String(sorter.dataIndex) : undefined,
              orderDirection: sorter?.sortOrder === "ascend" ? "asc" : "desc",
              pageNum: pagination?.currentPage ?? current.pageNum,
            }))}
            pagination={{
              currentPage: params.pageNum,
              pageSize: params.pageSize,
              total: list.data?.total ?? 0,
            }}
            rowKey="id"
            rowSelection={{
              onChange: (keys) => setSelected((keys ?? []).map(Number)),
              selectedRowKeys: selected,
            }}
            scroll={{ x: 1318 }}
          />}
        </div>
        <MobileRecordList testId="file-mobile-list">
          {(list.data?.list ?? []).map((row) => (
            <MobileRecordCard key={row.id} testId={`file-mobile-card-${row.id}`}>
              <MobileRecordTitle>{row.original}</MobileRecordTitle>
              <MobileRecordFields>
                <MobileRecordField label={t("pages.settings.file.suffix")} value={row.suffix} />
                <MobileRecordField label={t("pages.settings.file.scene")} value={options.data?.scenes.find((item) => item.value === row.scene)?.label ?? row.scene} />
                <MobileRecordField label={t("pages.settings.file.size")} value={formatSize(row.size)} />
                <MobileRecordField label={t("pages.settings.file.uploadedAt")} value={formatTimestamp(row.createdAt, i18n.resolvedLanguage || "en-US")} />
              </MobileRecordFields>
              <MobileRecordActions>
                <Button data-testid={`file-mobile-detail-${row.id}`} onClick={() => setDetailId(row.id)} theme="borderless">{t("pages.settings.file.detail")}</Button>
                {allowed(permissions, "system:file:download") ? <Button loading={downloadingId === row.id} onClick={() => void download(row)} theme="borderless">{t("pages.settings.file.download")}</Button> : null}
                {allowed(permissions, "system:file:remove") ? <Popconfirm content={t("pages.settings.deleteConfirm")} onConfirm={() => void remove([row.id])}><Button theme="borderless" type="danger">{t("pages.common.delete")}</Button></Popconfirm> : null}
              </MobileRecordActions>
            </MobileRecordCard>
          ))}
        </MobileRecordList>
      </Card>
      <Modal
        footer={null}
        onCancel={() => setUpload(undefined)}
        title={t(upload === "image" ? "pages.settings.file.uploadImage" : "pages.settings.file.upload")}
        visible={upload !== undefined}
        width="min(520px, calc(100vw - 24px))"
      >
        {upload ? (
          <ManagedUpload api={api} imageOnly={upload === "image"} onUploaded={refresh} />
        ) : null}
      </Modal>
      <Modal
        footer={null}
        onCancel={() => setDetailId(undefined)}
        title={t("pages.settings.file.detail")}
        visible={detailId !== undefined}
        width="min(720px, calc(100vw - 24px))"
      >
        <Spin spinning={detail.isPending}>
          <Descriptions data={detailData} row />
        </Spin>
      </Modal>
    </section>
  );
}
