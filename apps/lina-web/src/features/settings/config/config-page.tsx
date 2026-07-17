import Button from "@douyinfe/semi-ui/lib/es/button";
import Card from "@douyinfe/semi-ui/lib/es/card";
import CheckboxGroup from "@douyinfe/semi-ui/lib/es/checkbox/checkboxGroup";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import Input from "@douyinfe/semi-ui/lib/es/input";
import TextArea from "@douyinfe/semi-ui/lib/es/input/textarea";
import InputNumber from "@douyinfe/semi-ui/lib/es/inputNumber";
import Modal from "@douyinfe/semi-ui/lib/es/modal";
import Popconfirm from "@douyinfe/semi-ui/lib/es/popconfirm";
import RadioGroup from "@douyinfe/semi-ui/lib/es/radio/radioGroup";
import Select from "@douyinfe/semi-ui/lib/es/select";
import SideSheet from "@douyinfe/semi-ui/lib/es/sideSheet";
import Space from "@douyinfe/semi-ui/lib/es/space";
import Table from "@douyinfe/semi-ui/lib/es/table";
import type { ColumnProps } from "@douyinfe/semi-ui/lib/es/table/interface";
import Tag from "@douyinfe/semi-ui/lib/es/tag";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import Tooltip from "@douyinfe/semi-ui/lib/es/tooltip";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  createSystemConfigApi,
  type ConfigListParams,
  type ConfigValueOption,
  type ConfigValueType,
  type SysConfig,
} from "#/api/system/config";
import { useWorkbenchRuntime } from "#/app/workbench-runtime-context";
import { useAuthContext } from "#/auth/auth-context";
import { downloadBlob } from "#/features/iam/download";
import { ImportDialog } from "#/features/settings/import-dialog";
import { formatTimestamp } from "#/shared/format";

const valueTypes: readonly ConfigValueType[] = [
  "text",
  "textarea",
  "number",
  "boolean",
  "select",
  "radio",
  "multi_select",
  "richtext",
];

interface ConfigDraft {
  key: string;
  name: string;
  optionsText: string;
  remark: string;
  value: string;
  valueType: ConfigValueType;
}

function allowed(permissions: readonly string[], permission: string) {
  return permissions.includes("*") || permissions.includes(permission);
}

function resolveValueType(valueType: string | undefined): ConfigValueType {
  return valueTypes.includes(valueType as ConfigValueType) ? valueType as ConfigValueType : "text";
}

function formatOptions(options: readonly ConfigValueOption[] | undefined): string {
  return (options ?? [])
    .map(({ label, value }) => (label.trim() && label.trim() !== value.trim() ? `${label}=${value}` : value))
    .join("\n");
}

function parseOptions(input: string): ConfigValueOption[] {
  const seen = new Set<string>();
  const options: ConfigValueOption[] = [];
  for (const [index, rawLine] of input.split("\n").entries()) {
    const line = rawLine.trim();
    if (!line) continue;
    const separators = [line.indexOf("="), line.indexOf("|")].filter((value) => value >= 0);
    const separator = separators.length ? Math.min(...separators) : -1;
    const [rawLabel, rawValue] = separator >= 0
      ? [line.slice(0, separator), line.slice(separator + 1)]
      : [line, line];
    const value = rawValue.trim();
    if (!value) throw new Error(`options line ${index + 1} requires a value`);
    if (seen.has(value)) throw new Error(`options line ${index + 1} duplicates ${value}`);
    seen.add(value);
    options.push({ label: rawLabel.trim() || value, value });
  }
  return options;
}

function draftFrom(config?: SysConfig): ConfigDraft {
  return {
    key: config?.key ?? "",
    name: config?.name ?? "",
    optionsText: formatOptions(config?.options),
    remark: config?.remark ?? "",
    value: config?.value ?? "",
    valueType: resolveValueType(config?.valueType),
  };
}

function ValueEditor({
  disabled,
  draft,
  onChange,
  options,
  t,
}: {
  disabled: boolean;
  draft: ConfigDraft;
  onChange(value: string): void;
  options: readonly ConfigValueOption[];
  t(key: string): string;
}) {
  const optionList = options.map((item) => ({ label: item.label, value: item.value }));
  switch (draft.valueType) {
    case "boolean":
      return <RadioGroup
        aria-label={t("pages.settings.config.value")}
        disabled={disabled}
        onChange={(event) => onChange(String(event.target.value))}
        options={[
          { label: t("pages.common.yes"), value: "true" },
          { label: t("pages.common.no"), value: "false" },
        ]}
        value={draft.value || "false"}
      />;
    case "number":
      return <InputNumber
        aria-label={t("pages.settings.config.value")}
        disabled={disabled}
        onChange={(value) => onChange(String(value ?? ""))}
        value={draft.value}
      />;
    case "select":
      return <Select
        aria-label={t("pages.settings.config.value")}
        disabled={disabled}
        onChange={(value) => onChange(String(value ?? ""))}
        optionList={optionList}
        value={draft.value || undefined}
      />;
    case "radio":
      return <RadioGroup
        aria-label={t("pages.settings.config.value")}
        disabled={disabled}
        onChange={(event) => onChange(String(event.target.value))}
        options={optionList}
        value={draft.value || undefined}
      />;
    case "multi_select":
      return <CheckboxGroup
        aria-label={t("pages.settings.config.value")}
        disabled={disabled}
        onChange={(values) => onChange(values.map(String).join(";"))}
        options={optionList}
        value={draft.value.split(";").filter(Boolean)}
      />;
    case "textarea":
    case "richtext":
      return <TextArea
        aria-label={t("pages.settings.config.value")}
        disabled={disabled}
        onChange={onChange}
        rows={draft.valueType === "richtext" ? 8 : 4}
        value={draft.value}
      />;
    case "text":
    default:
      return <Input
        aria-label={t("pages.settings.config.value")}
        disabled={disabled}
        onChange={onChange}
        value={draft.value}
      />;
  }
}

export default function ConfigPage() {
  const { apiClient } = useWorkbenchRuntime();
  const auth = useAuthContext();
  const { i18n, t } = useTranslation();
  const api = useMemo(() => createSystemConfigApi(apiClient), [apiClient]);
  const permissions = auth?.user.permissions ?? [];
  const [params, setParams] = useState<ConfigListParams>({ pageNum: 1, pageSize: 10 });
  const [searchFormKey, setSearchFormKey] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [editId, setEditId] = useState<number | "new">();
  const [draft, setDraft] = useState<ConfigDraft>(draftFrom());
  const [importOpen, setImportOpen] = useState(false);
  const query = useQuery({ queryFn: () => api.list(params), queryKey: ["settings", "config", params] });
  const detail = useQuery({
    enabled: typeof editId === "number",
    queryFn: () => api.get(editId as number),
    queryKey: ["settings", "config-detail", editId],
  });

  useEffect(() => {
    if (editId === "new") {
      setDraft(draftFrom());
      return;
    }
    if (typeof editId === "number" && detail.data?.id === editId) {
      setDraft(draftFrom(detail.data));
    }
  }, [detail.data, editId]);

  async function refresh() {
    setSelected([]);
    await query.refetch();
  }

  async function remove(id: number) {
    await api.delete(id);
    Toast.success(t("pages.common.deleteSuccess"));
    await refresh();
  }

  function updateDraft(partial: Partial<ConfigDraft>) {
    setDraft((current) => ({ ...current, ...partial }));
  }

  async function save() {
    if (!draft.name.trim() || !draft.key.trim() || !draft.value.trim()) {
      Toast.error(t("pages.settings.required"));
      return;
    }
    let options: ConfigValueOption[] = [];
    try {
      options = parseOptions(draft.optionsText);
    } catch {
      Toast.error(t("pages.settings.config.optionsInvalid"));
      return;
    }
    if (["select", "radio", "multi_select"].includes(draft.valueType) && !options.length) {
      Toast.error(t("pages.settings.config.optionsRequired"));
      return;
    }
    const input = {
      key: draft.key.trim(),
      name: draft.name.trim(),
      options,
      remark: draft.remark,
      value: draft.value.trim(),
      valueType: draft.valueType,
    };
    if (typeof editId === "number") await api.update(editId, input);
    else await api.create(input);
    Toast.success(t(editId === "new" ? "pages.common.createSuccess" : "pages.common.updateSuccess"));
    await refresh();
    setEditId(undefined);
  }

  const columns: ColumnProps<SysConfig>[] = [
    { dataIndex: "name", title: t("pages.settings.config.name"), width: 160 },
    { dataIndex: "key", title: t("pages.settings.config.key"), width: 200 },
    { dataIndex: "value", title: t("pages.settings.config.value"), width: 140 },
    {
      dataIndex: "valueType",
      render: (value) => <Tag>{t(`pages.settings.config.valueTypes.${resolveValueType(String(value))}`)}</Tag>,
      title: t("pages.settings.config.valueType"),
      width: 120,
    },
    {
      dataIndex: "isBuiltin",
      render: (value) => value === 1 ? <Tag>{t("pages.settings.builtin")}</Tag> : null,
      title: t("pages.settings.builtin"),
      width: 70,
    },
    {
      dataIndex: "createdAt",
      fixed: "right",
      render: (value) => formatTimestamp(value as number | null, i18n.resolvedLanguage || "en-US"),
      title: t("pages.common.createdAt"),
      width: 170,
    },
    {
      fixed: "right",
      render: (_, row) => <Space>
        {row.canEdit !== false && allowed(permissions, "system:config:edit") ? <Button data-testid={`config-edit-${row.id}`} onClick={() => setEditId(row.id)} theme="borderless">{t("pages.common.edit")}</Button> : null}
        {row.canEdit !== false && allowed(permissions, "system:config:remove") ? row.isBuiltin === 1 ? <Tooltip content={t("pages.common.builtinDeleteDisabled")}><span><Button data-testid={`config-delete-${row.id}`} disabled theme="borderless" type="danger">{t("pages.common.delete")}</Button></span></Tooltip> : <Popconfirm content={t("pages.settings.deleteConfirm")} onConfirm={() => void remove(row.id)}><Button data-testid={`config-delete-${row.id}`} theme="borderless" type="danger">{t("pages.common.delete")}</Button></Popconfirm> : null}
      </Space>,
      title: t("pages.common.actions"),
      width: 140,
    },
  ];
  const selectedConfig = typeof editId === "number" && detail.data?.id === editId ? detail.data : undefined;
  const metadataReadOnly = selectedConfig?.isBuiltin === 1;
  let parsedOptions: ConfigValueOption[] = [];
  try {
    parsedOptions = parseOptions(draft.optionsText);
  } catch {
    // Save displays a localized error and blocks invalid option metadata.
  }
  const needsOptions = ["select", "radio", "multi_select"].includes(draft.valueType);

  return <section className="feature-page" data-testid="config-page">
    <Typography.Title heading={3}>{t("pages.settings.config.title")}</Typography.Title>
    <Card>
      <Form<ConfigListParams> className="iam-search-form" key={searchFormKey} layout="horizontal" onSubmit={(values) => setParams((current) => ({ ...current, ...values, pageNum: 1 }))}>
        <Form.Input field="name" label={t("pages.settings.config.name")} />
        <Form.Input field="key" label={t("pages.settings.config.key")} />
        <Button htmlType="reset" onClick={() => { setSearchFormKey((value) => value + 1); setParams((current) => ({ pageNum: 1, pageSize: current.pageSize })); }}>{t("pages.common.reset")}</Button>
        <Button htmlType="submit" theme="solid" type="primary">{t("pages.common.search")}</Button>
      </Form>
    </Card>
    <Card>
      <div className="iam-toolbar"><Space>
        {allowed(permissions, "system:config:export") ? <Button onClick={() => Modal.confirm({ content: t("pages.settings.exportConfirm"), onOk: () => api.export({ ...params, ids: selected }).then((blob) => downloadBlob(blob, "configs.xlsx")), title: t("pages.common.confirmTitle") })}>{t("pages.settings.export")}</Button> : null}
        {allowed(permissions, "system:config:add") ? <><Button onClick={() => setImportOpen(true)}>{t("pages.settings.importAction")}</Button><Button onClick={() => setEditId("new")} theme="solid" type="primary">{t("pages.common.add")}</Button></> : null}
      </Space></div>
      <div data-testid="config-table"><Table<SysConfig> columns={columns} dataSource={query.data?.list ?? []} loading={query.isPending} pagination={{ currentPage: params.pageNum, onChange: (page) => setParams((current) => ({ ...current, pageNum: page })), pageSize: params.pageSize, total: query.data?.total ?? 0 }} rowKey="id" rowSelection={{ getCheckboxProps: (row) => ({ disabled: row?.canEdit === false || row?.isBuiltin === 1 }), onChange: (keys) => setSelected((keys ?? []).map(Number)), selectedRowKeys: selected }} scroll={{ x: 1200 }} /></div>
    </Card>
    <SideSheet onCancel={() => setEditId(undefined)} title={t(editId === "new" ? "pages.settings.config.create" : "pages.settings.config.edit")} visible={editId !== undefined}>
      <form className="semi-form" data-testid="config-editor-form" onSubmit={(event) => { event.preventDefault(); void save(); }}>
        <label className="semi-form-field"><Typography.Text>{t("pages.settings.config.name")}</Typography.Text><Input aria-label={t("pages.settings.config.name")} onChange={(name) => updateDraft({ name })} value={draft.name} /></label>
        <label className="semi-form-field"><Typography.Text>{t("pages.settings.config.key")}</Typography.Text><Input aria-label={t("pages.settings.config.key")} onChange={(key) => updateDraft({ key })} value={draft.key} /></label>
        <label className="semi-form-field"><Typography.Text>{t("pages.settings.config.valueType")}</Typography.Text><Select aria-label={t("pages.settings.config.valueType")} disabled={metadataReadOnly} onChange={(value) => updateDraft({ valueType: resolveValueType(String(value)) })} optionList={valueTypes.map((value) => ({ label: t(`pages.settings.config.valueTypes.${value}`), value }))} value={draft.valueType} /></label>
        {needsOptions ? <label className="semi-form-field"><Typography.Text>{t("pages.settings.config.options")}</Typography.Text><TextArea aria-label={t("pages.settings.config.options")} disabled={metadataReadOnly} onChange={(optionsText) => updateDraft({ optionsText })} placeholder={t("pages.settings.config.optionsHint")} rows={4} value={draft.optionsText} /></label> : null}
        <div className="semi-form-field" data-testid={`config-value-editor-${draft.valueType}`}><Typography.Text>{t("pages.settings.config.value")}</Typography.Text><ValueEditor disabled={false} draft={draft} onChange={(value) => updateDraft({ value })} options={parsedOptions} t={t} /></div>
        <label className="semi-form-field"><Typography.Text>{t("pages.common.remark")}</Typography.Text><TextArea aria-label={t("pages.common.remark")} onChange={(remark) => updateDraft({ remark })} rows={3} value={draft.remark} /></label>
        <Button htmlType="submit" theme="solid" type="primary">{t("pages.common.save")}</Button>
      </form>
    </SideSheet>
    <ImportDialog filename="config-import-template.xlsx" importFile={api.import} onClose={() => setImportOpen(false)} onSaved={async () => { await refresh(); window.location.reload(); }} open={importOpen} overwriteLabel={t("pages.settings.config.importOverwrite")} template={api.getImportTemplate} title={t("pages.settings.config.importTitle")} />
  </section>;
}
