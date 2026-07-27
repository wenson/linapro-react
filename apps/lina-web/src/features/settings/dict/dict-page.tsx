import Button from "@douyinfe/semi-ui/lib/es/button";
import Card from "@douyinfe/semi-ui/lib/es/card";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import Modal from "@douyinfe/semi-ui/lib/es/modal";
import Popconfirm from "@douyinfe/semi-ui/lib/es/popconfirm";
import SideSheet from "@douyinfe/semi-ui/lib/es/sideSheet";
import Space from "@douyinfe/semi-ui/lib/es/space";
import Table from "@douyinfe/semi-ui/lib/es/table";
import type { ColumnProps } from "@douyinfe/semi-ui/lib/es/table/interface";
import Tag from "@douyinfe/semi-ui/lib/es/tag";
import type { TagColor } from "@douyinfe/semi-ui/lib/es/tag/interface";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import Tooltip from "@douyinfe/semi-ui/lib/es/tooltip";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  createSystemDictApi,
  type DictData,
  type DictDataListParams,
  type DictType,
  type DictTypeListParams,
} from "#/api/system/dict";
import { useWorkbenchRuntime } from "#/app/workbench-runtime-context";
import { useAuthContext } from "#/auth/auth-context";
import { downloadBlob } from "#/features/iam/download";
import { ImportDialog } from "#/features/settings/import-dialog";
import { MobileRecordActions, MobileRecordCard, MobileRecordField, MobileRecordFields, MobileRecordList, MobileRecordTitle } from "#/plugin-ui/mobile-record";

function allowed(permissions: readonly string[], key: string) {
  return permissions.includes("*") || permissions.includes(key);
}

function tagColor(value: string): TagColor {
  const semanticColors: Record<string, TagColor> = {
    danger: "red",
    default: "grey",
    info: "cyan",
    primary: "blue",
    success: "green",
    warning: "orange",
  };
  if (semanticColors[value]) return semanticColors[value];
  const colors: readonly TagColor[] = [
    "amber", "blue", "cyan", "green", "grey", "indigo", "light-blue",
    "light-green", "lime", "orange", "pink", "purple", "red", "teal",
    "violet", "yellow", "white",
  ];
  return colors.includes(value as TagColor) ? value as TagColor : "blue";
}

const tagStyleValues = [
  "default", "primary", "success", "warning", "danger", "info",
  "cyan", "green", "red", "orange", "pink", "purple",
] as const;

export default function DictPage() {
  const { apiClient } = useWorkbenchRuntime();
  const auth = useAuthContext();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const api = useMemo(() => createSystemDictApi(apiClient), [apiClient]);
  const permissions = auth?.user.permissions ?? [];
  const [typeParams, setTypeParams] = useState<DictTypeListParams>({ pageNum: 1, pageSize: 10 });
  const [dataParams, setDataParams] = useState<DictDataListParams>({ pageNum: 1, pageSize: 10 });
  const [typeFormKey, setTypeFormKey] = useState(0);
  const [dataFormKey, setDataFormKey] = useState(0);
  const [selectedType, setSelectedType] = useState("");
  const [selectedTypeIds, setSelectedTypeIds] = useState<number[]>([]);
  const [selectedDataIds, setSelectedDataIds] = useState<number[]>([]);
  const [typeEdit, setTypeEdit] = useState<number | "new">();
  const [dataEdit, setDataEdit] = useState<number | "new">();
  const [importTarget, setImportTarget] = useState<"data" | "types">();

  const types = useQuery({
    queryFn: () => api.listTypes(typeParams),
    queryKey: ["settings", "dict-types", typeParams],
  });
  const data = useQuery({
    enabled: Boolean(selectedType),
    queryFn: () => api.listData({ ...dataParams, dictType: selectedType }),
    queryKey: ["settings", "dict-data", selectedType, dataParams],
  });
  const typeDetail = useQuery({
    enabled: typeof typeEdit === "number",
    queryFn: () => api.getType(typeEdit as number),
    queryKey: ["settings", "dict-type", typeEdit],
  });
  const dataDetail = useQuery({
    enabled: typeof dataEdit === "number",
    queryFn: () => api.getData(dataEdit as number),
    queryKey: ["settings", "dict-data-detail", dataEdit],
  });

  async function refreshTypes() {
    setSelectedTypeIds([]);
    await types.refetch();
  }

  async function refreshData() {
    setSelectedDataIds([]);
    await Promise.all([
      data.refetch(),
      selectedType
        ? queryClient.invalidateQueries({ queryKey: ["runtime", "dictionary", selectedType] })
        : Promise.resolve(),
    ]);
  }

  async function refreshAfterImport() {
    if (importTarget === "data") {
      await refreshData();
      return;
    }
    await refreshTypes();
    await queryClient.invalidateQueries({ queryKey: ["runtime", "dictionary"] });
    if (selectedType) await refreshData();
  }

  async function saveType(values: Partial<DictType>) {
    const updating = typeof typeEdit === "number";
    if (updating) await api.updateType(typeEdit, values);
    else await api.createType(values);
    Toast.success(t(updating ? "pages.common.updateSuccess" : "pages.common.createSuccess"));
    setTypeEdit(undefined);
    await refreshTypes();
  }

  async function saveData(values: Partial<DictData>) {
    const input = { ...values, dictType: selectedType };
    const updating = typeof dataEdit === "number";
    if (updating) await api.updateData(dataEdit, input);
    else await api.createData(input);
    Toast.success(t(updating ? "pages.common.updateSuccess" : "pages.common.createSuccess"));
    setDataEdit(undefined);
    await refreshData();
  }

  async function removeType(row: DictType) {
    await api.deleteType(row.id);
    queryClient.removeQueries({ queryKey: ["runtime", "dictionary", row.type] });
    if (selectedType === row.type) {
      setSelectedType("");
      setSelectedDataIds([]);
    }
    Toast.success(t("pages.common.deleteSuccess"));
    await refreshTypes();
  }

  async function removeSelectedTypes() {
    await Promise.all(selectedTypeIds.map((id) => api.deleteType(id)));
    for (const row of types.data?.list ?? []) {
      if (selectedTypeIds.includes(row.id)) {
        queryClient.removeQueries({ queryKey: ["runtime", "dictionary", row.type] });
      }
    }
    const selectedRow = (types.data?.list ?? []).find((row) => row.type === selectedType);
    if (selectedRow && selectedTypeIds.includes(selectedRow.id)) {
      setSelectedType("");
      setSelectedDataIds([]);
    }
    Toast.success(t("pages.common.deleteSuccess"));
    await refreshTypes();
  }

  async function removeData(id: number) {
    await api.deleteData(id);
    Toast.success(t("pages.common.deleteSuccess"));
    await refreshData();
  }

  async function removeSelectedData() {
    await Promise.all(selectedDataIds.map((id) => api.deleteData(id)));
    Toast.success(t("pages.common.deleteSuccess"));
    await refreshData();
  }

  function resetTypeSearch() {
    setTypeParams((current) => ({ pageNum: 1, pageSize: current.pageSize }));
    setTypeFormKey((value) => value + 1);
  }

  function resetDataSearch() {
    setDataParams((current) => ({ pageNum: 1, pageSize: current.pageSize }));
    setDataFormKey((value) => value + 1);
  }

  function confirmTypeExport() {
    Modal.confirm({
      content: t(selectedTypeIds.length ? "pages.settings.dict.exportSelectedConfirm" : "pages.settings.dict.exportAllConfirm"),
      onOk: () => api.exportTypes({ ...typeParams, ids: selectedTypeIds }).then((blob) => downloadBlob(blob, "dictionary.xlsx")),
      title: t("pages.common.confirmTitle"),
    });
  }

  function typeStatus(row: DictType) { return t(row.status === 1 ? "pages.common.enabled" : "pages.common.disabled"); }
  function renderTypeActions(row: DictType) { return <>{row.canEdit !== false && allowed(permissions, "system:dict:edit") ? <Button data-testid={`dict-type-edit-${row.id}`} onClick={(event) => { event.stopPropagation(); setTypeEdit(row.id); }} theme="borderless">{t("pages.common.edit")}</Button> : null}{row.canEdit !== false && allowed(permissions, "system:dict:remove") ? row.isBuiltin === 1 ? <Tooltip content={t("pages.common.builtinDeleteDisabled")}><span><Button data-testid={`dict-type-delete-${row.id}`} disabled theme="borderless" type="danger">{t("pages.common.delete")}</Button></span></Tooltip> : <Popconfirm content={t("pages.settings.dict.cascadeConfirm")} onConfirm={() => void removeType(row)}><Button data-testid={`dict-type-delete-${row.id}`} theme="borderless" type="danger">{t("pages.common.delete")}</Button></Popconfirm> : null}</>; }
  function renderDataActions(row: DictData) { return <>{row.canEdit !== false && allowed(permissions, "system:dict:edit") ? <Button data-testid={`dict-data-edit-${row.id}`} onClick={() => setDataEdit(row.id)} theme="borderless">{t("pages.common.edit")}</Button> : null}{row.canEdit !== false && allowed(permissions, "system:dict:remove") ? row.isBuiltin === 1 ? <Tooltip content={t("pages.common.builtinDeleteDisabled")}><span><Button data-testid={`dict-data-delete-${row.id}`} disabled theme="borderless" type="danger">{t("pages.common.delete")}</Button></span></Tooltip> : <Popconfirm content={t("pages.settings.deleteConfirm")} onConfirm={() => void removeData(row.id)}><Button data-testid={`dict-data-delete-${row.id}`} theme="borderless" type="danger">{t("pages.common.delete")}</Button></Popconfirm> : null}</>; }

  const typeColumns: ColumnProps<DictType>[] = [
    { dataIndex: "name", ellipsis: true, title: t("pages.settings.dict.name"), width: 180 },
    { dataIndex: "type", ellipsis: true, title: t("pages.settings.dict.type"), width: 190 },
    {
      dataIndex: "status",
      render: (value) => <Tag color={value === 1 ? "green" : "red"}>{t(value === 1 ? "pages.common.enabled" : "pages.common.disabled")}</Tag>,
      title: t("pages.common.status"),
      width: 90,
    },
    {
      fixed: "right",
      render: (_, row) => <Space>{renderTypeActions(row)}</Space>,
      title: t("pages.common.actions"),
      width: 140,
    },
  ];
  const dataColumns: ColumnProps<DictData>[] = [
    { dataIndex: "label", ellipsis: true, title: t("pages.settings.dict.label"), width: 180 },
    { dataIndex: "value", ellipsis: true, title: t("pages.settings.dict.value"), width: 170 },
    {
      dataIndex: "tagStyle",
      render: (value, row) => <Tag className={row.cssClass || undefined} color={tagColor(String(value))}>{row.label}</Tag>,
      title: t("pages.settings.dict.style"),
      width: 170,
    },
    { dataIndex: "sort", title: t("pages.common.sort"), width: 80 },
    {
      fixed: "right",
      render: (_, row) => <Space>{renderDataActions(row)}</Space>,
      title: t("pages.common.actions"),
      width: 140,
    },
  ];

  return <section className="feature-page" data-testid="dict-page">
    <Typography.Title heading={3}>{t("pages.settings.dict.title")}</Typography.Title>
    <div className="dict-grid">
      <section id="dict-type">
        <Card title={t("pages.settings.dict.types")}>
          <Form<DictTypeListParams>
            className="iam-search-form"
            id="dict-type-filter-form"
            key={typeFormKey}
            layout="horizontal"
            onSubmit={(values) => setTypeParams((current) => ({ ...current, ...values, pageNum: 1 }))}
          >
            <Form.Input field="name" id="dict-type-filter-name" label={t("pages.settings.dict.name")} />
            <Form.Input field="type" id="dict-type-filter-type" label={t("pages.settings.dict.type")} />
            <Button htmlType="reset" onClick={resetTypeSearch}>{t("pages.common.reset")}</Button>
            <Button htmlType="submit" theme="solid" type="primary">{t("pages.common.search")}</Button>
          </Form>
          <div className="iam-toolbar"><Space>
            {allowed(permissions, "system:dict:remove") ? <Button disabled={!selectedTypeIds.length} onClick={() => Modal.confirm({ content: t("pages.settings.dict.cascadeConfirm"), onOk: removeSelectedTypes, title: t("pages.common.confirmTitle") })} type="danger">{t("pages.common.delete")}</Button> : null}
            {allowed(permissions, "system:dict:export") ? <Button onClick={confirmTypeExport}>{t("pages.settings.export")}</Button> : null}
            {allowed(permissions, "system:dict:add") ? <>
              <Button onClick={() => setImportTarget("types")}>{t("pages.settings.importAction")}</Button>
              <Button onClick={() => setTypeEdit("new")} theme="solid" type="primary">{t("pages.common.add")}</Button>
            </> : null}
          </Space></div>
          <div className="responsive-desktop-table" data-testid="dict-type-table"><Table<DictType>
            columns={typeColumns}
            dataSource={types.data?.list ?? []}
            loading={types.isPending}
            onRow={(row) => ({ onClick: () => { setSelectedType(row?.type ?? ""); setDataParams((current) => ({ ...current, pageNum: 1 })); } })}
            pagination={{ currentPage: typeParams.pageNum, onChange: (pageNum) => setTypeParams((current) => ({ ...current, pageNum })), pageSize: typeParams.pageSize, total: types.data?.total ?? 0 }}
            rowKey="id"
            rowSelection={{ getCheckboxProps: (row) => ({ disabled: row?.canEdit === false || row?.isBuiltin === 1 }), onChange: (keys) => setSelectedTypeIds((keys ?? []).map(Number)), selectedRowKeys: selectedTypeIds }}
            scroll={{ x: 648 }}
          /></div>
          <MobileRecordList testId="dict-type-mobile-list">{(types.data?.list ?? []).map((row) => <MobileRecordCard key={row.id} testId={`dict-type-mobile-card-${row.id}`}><MobileRecordTitle>{row.name}</MobileRecordTitle><MobileRecordFields><MobileRecordField label={t("pages.settings.dict.type")} value={row.type} /><MobileRecordField label={t("pages.common.status")} value={typeStatus(row)} /></MobileRecordFields><MobileRecordActions><Button onClick={() => { setSelectedType(row.type); setDataParams((current) => ({ ...current, pageNum: 1 })); }} theme="borderless">{t("pages.common.detail")}</Button>{renderTypeActions(row)}</MobileRecordActions></MobileRecordCard>)}</MobileRecordList>
        </Card>
      </section>
      <section id="dict-data">
        <Card title={selectedType || t("pages.settings.dict.selectType")}>
          <Form<DictDataListParams>
            className="iam-search-form"
            id="dict-data-filter-form"
            key={dataFormKey}
            layout="horizontal"
            onSubmit={(values) => setDataParams((current) => ({ ...current, ...values, pageNum: 1 }))}
          >
            <Form.Input field="label" id="dict-data-filter-label" label={t("pages.settings.dict.label")} />
            <Button htmlType="reset" onClick={resetDataSearch}>{t("pages.common.reset")}</Button>
            <Button htmlType="submit" disabled={!selectedType} theme="solid" type="primary">{t("pages.common.search")}</Button>
          </Form>
          <div className="iam-toolbar"><Space>
            {selectedType && allowed(permissions, "system:dict:remove") ? <Button disabled={!selectedDataIds.length} onClick={() => Modal.confirm({ content: t("pages.settings.deleteConfirm"), onOk: removeSelectedData, title: t("pages.common.confirmTitle") })} type="danger">{t("pages.common.delete")}</Button> : null}
            {selectedType && allowed(permissions, "system:dict:add") ? <Button onClick={() => setDataEdit("new")} theme="solid" type="primary">{t("pages.common.add")}</Button> : null}
          </Space></div>
          <div className="responsive-desktop-table" data-testid="dict-data-table"><Table<DictData>
            columns={dataColumns}
            dataSource={data.data?.list ?? []}
            loading={Boolean(selectedType) && data.isPending}
            pagination={{ currentPage: dataParams.pageNum, onChange: (pageNum) => setDataParams((current) => ({ ...current, pageNum })), pageSize: dataParams.pageSize, total: data.data?.total ?? 0 }}
            rowKey="id"
            rowSelection={{ getCheckboxProps: (row) => ({ disabled: row?.canEdit === false || row?.isBuiltin === 1 }), onChange: (keys) => setSelectedDataIds((keys ?? []).map(Number)), selectedRowKeys: selectedDataIds }}
            scroll={{ x: 788 }}
          /></div>
          <MobileRecordList testId="dict-data-mobile-list">{(data.data?.list ?? []).map((row) => <MobileRecordCard key={row.id} testId={`dict-data-mobile-card-${row.id}`}><MobileRecordTitle>{row.label}</MobileRecordTitle><MobileRecordFields><MobileRecordField label={t("pages.settings.dict.value")} value={row.value} /><MobileRecordField label={t("pages.settings.dict.style")} value={row.tagStyle} /></MobileRecordFields><MobileRecordActions>{renderDataActions(row)}</MobileRecordActions></MobileRecordCard>)}</MobileRecordList>
        </Card>
      </section>
    </div>
    <SideSheet onCancel={() => setTypeEdit(undefined)} title={t("pages.settings.dict.editType")} visible={typeEdit !== undefined} width="min(448px, 100vw)">
      <Form<Partial<DictType>> key={`${typeEdit}-${typeDetail.data?.updatedAt ?? 0}`} initValues={typeDetail.data ?? { status: 1 }} labelPosition="top" onSubmit={saveType}>
        <Form.Input field="name" label={t("pages.settings.dict.name")} rules={[{ required: true, message: t("pages.settings.required") }]} />
        <Form.Input field="type" label={t("pages.settings.dict.type")} rules={[{ required: true, message: t("pages.settings.required") }]} />
        <Form.RadioGroup field="status" label={t("pages.common.status")} options={[{ label: t("pages.common.enabled"), value: 1 }, { label: t("pages.common.disabled"), value: 0 }]} />
        <Form.Checkbox field="allowTenantOverride">{t("pages.settings.dict.allowOverride")}</Form.Checkbox>
        <Form.TextArea field="remark" label={t("pages.common.remark")} />
        <Button htmlType="submit" theme="solid" type="primary">{t("pages.common.save")}</Button>
      </Form>
    </SideSheet>
    <SideSheet onCancel={() => setDataEdit(undefined)} title={t("pages.settings.dict.editData")} visible={dataEdit !== undefined} width="min(448px, 100vw)">
      <Form<Partial<DictData>> key={`${dataEdit}-${dataDetail.data?.updatedAt ?? 0}`} initValues={dataDetail.data ?? { sort: 0, status: 1, tagStyle: "default" }} labelPosition="top" onSubmit={saveData}>
        <Form.Input field="label" label={t("pages.settings.dict.label")} rules={[{ required: true, message: t("pages.settings.required") }]} />
        <Form.Input field="value" label={t("pages.settings.dict.value")} rules={[{ required: true, message: t("pages.settings.required") }]} />
        <Form.InputNumber field="sort" label={t("pages.common.sort")} />
        <Form.Select field="tagStyle" label={t("pages.settings.dict.style")} optionList={tagStyleValues.map((value) => ({ label: t(`pages.settings.dict.styles.${value}`), value }))} />
        <Form.Input field="cssClass" label="CSS class" />
        <Form.RadioGroup field="status" label={t("pages.common.status")} options={[{ label: t("pages.common.enabled"), value: 1 }, { label: t("pages.common.disabled"), value: 0 }]} />
        <Form.TextArea field="remark" label={t("pages.common.remark")} />
        <Button htmlType="submit" theme="solid" type="primary">{t("pages.common.save")}</Button>
      </Form>
    </SideSheet>
    <ImportDialog
      filename={importTarget === "data" ? "dict-data-import-template.xlsx" : "dict-import-template.xlsx"}
      importFile={importTarget === "data" ? api.importData : api.importCombined}
      onClose={() => setImportTarget(undefined)}
      onSaved={refreshAfterImport}
      open={importTarget !== undefined}
      overwriteLabel={t(importTarget === "data" ? "pages.settings.dict.importDataOverwrite" : "pages.settings.dict.importOverwrite")}
      template={importTarget === "data" ? api.templateData : api.templateCombined}
      title={t(importTarget === "data" ? "pages.settings.dict.importDataTitle" : "pages.settings.dict.importTitle")}
    />
  </section>;
}
