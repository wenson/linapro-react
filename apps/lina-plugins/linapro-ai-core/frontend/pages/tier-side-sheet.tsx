import Banner from "@douyinfe/semi-ui/lib/es/banner";
import Button from "@douyinfe/semi-ui/lib/es/button";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import type { FormApi } from "@douyinfe/semi-ui/lib/es/form/interface";
import SideSheet from "@douyinfe/semi-ui/lib/es/sideSheet";
import Spin from "@douyinfe/semi-ui/lib/es/spin";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import { useEffect, useMemo, useState } from "react";

import type { AiCoreApi, Model, Provider, Tier, TierTestResult } from "./ai-client";
import { formatLatencyMs, modelProtocolGroups, tierDisplayName, type Translate } from "./ai-data";
import "./ai-core.css";

interface TierValues { defaultEffort?: string; enabled?: number; modelId?: number; providerId?: number }

export function TierSideSheet({ api, onClose, onSaved, open, t, tier }: {
  api: AiCoreApi; onClose(): void; onSaved(): Promise<void>; open: boolean; t: Translate; tier?: Tier;
}) {
  const [providers, setProviders] = useState<Provider[]>([]); const [models, setModels] = useState<Model[]>([]); const [loading, setLoading] = useState(false); const [saving, setSaving] = useState(false); const [testing, setTesting] = useState(false); const [result, setResult] = useState<TierTestResult>();
  const [formApi, setFormApi] = useState<FormApi<TierValues>>();
  useEffect(() => {
    let active = true; if (!open || !tier) return () => { active = false; };
    const selectedProvider = tier.binding?.providerId;
    queueMicrotask(() => {
      if (!active) return;
      setLoading(true); setResult(undefined);
      void Promise.all([api.providerList({ enabled: 1, pageNum: 1, pageSize: 100 }), selectedProvider ? api.providerModels(selectedProvider, 1) : Promise.resolve([])]).then(([providerResult, modelResult]) => { if (active) { setProviders(providerResult.items); setModels(modelResult); } }).catch((error: unknown) => Toast.error(error instanceof Error ? error.message : String(error))).finally(() => { if (active) setLoading(false); });
    });
    return () => { active = false; };
  }, [api, open, tier]);
  async function changeProvider(value: unknown) { const next = Number(value || 0); formApi?.setValue("modelId", undefined); setModels(next ? await api.providerModels(next, 1) : []); }
  const initial = useMemo<TierValues>(() => ({ defaultEffort: tier?.defaultEffort || "", enabled: tier?.enabled ?? 0, modelId: tier?.binding?.modelId, providerId: tier?.binding?.providerId }), [tier]);
  function payload(values: TierValues) { return { capabilityMethod: tier?.capabilityMethod || "generate", capabilityType: tier?.capabilityType || "text", defaultEffort: tier?.capabilityType === "text" && tier?.capabilityMethod === "generate" ? values.defaultEffort || "" : "", enabled: Number(values.enabled ?? 0), modelId: Number(values.modelId || 0), providerId: Number(values.providerId || 0) }; }
  function valid(values: ReturnType<typeof payload>, requireBinding: boolean) { const required = requireBinding || values.enabled === 1 || values.providerId > 0 || values.modelId > 0; if (required && (!values.providerId || !values.modelId || !models.some((item) => item.id === values.modelId))) { Toast.error(t("plugin.linapro-ai-core.tier.messages.bindingRequired")); return false; } return true; }
  async function submit(values: TierValues) { if (!tier) return; const next = payload(values); if (!valid(next, false)) return; setSaving(true); try { await api.tierUpdate(tier.code, next); Toast.success(t("pages.common.updateSuccess")); await onSaved(); onClose(); } finally { setSaving(false); } }
  async function test(values: TierValues) { if (!tier) return; const next = payload(values); if (!valid(next, true)) return; setTesting(true); try { const output = await api.tierTest(tier.code, { ...next, maxOutputTokens: 128, thinkingEffort: next.defaultEffort }); setResult(output); const text = output.errorSummary || t(output.status === "success" ? "plugin.linapro-ai-core.tier.messages.testSuccess" : "plugin.linapro-ai-core.tier.messages.testFailed"); (output.status === "success" ? Toast.success : Toast.error)(`${text} (${formatLatencyMs(output.latencyMs)})`); await onSaved(); } finally { setTesting(false); } }
  async function testCurrent() { if (!formApi) return; await formApi.validate(); await test(formApi.getValues()); }
  return <SideSheet closable onCancel={onClose} title={t("plugin.linapro-ai-core.tier.drawer.editTitle", { name: tierDisplayName(t, tier) })} visible={open} width={720}>{loading ? <Spin aria-label={t("pages.common.loading")} /> : <Form<TierValues> getFormApi={setFormApi} key={tier?.code ?? "none"} initValues={initial} labelPosition="top" onSubmit={submit}>
    <Form.RadioGroup field="enabled" label={t("pages.common.status")} options={[{ label: t("plugin.linapro-ai-core.common.enabled"), value: 1 }, { label: t("plugin.linapro-ai-core.common.disabled"), value: 0 }]} />
    {tier?.capabilityType === "text" && tier.capabilityMethod === "generate" ? <Form.Select field="defaultEffort" label={t("plugin.linapro-ai-core.tier.fields.defaultEffort")} optionList={[{ label: t("plugin.linapro-ai-core.effort.empty"), value: "" }, { label: "low", value: "low" }, { label: "medium", value: "medium" }, { label: "high", value: "high" }]} /> : null}
    <Form.Select field="providerId" filter label={t("plugin.linapro-ai-core.tier.fields.provider")} onChange={(value) => void changeProvider(value)} optionList={providers.map((item) => ({ label: item.name, value: item.id }))} />
    <Form.Select field="modelId" filter label={t("plugin.linapro-ai-core.tier.fields.model")}>
      {modelProtocolGroups(models).map((group) => <Form.Select.OptGroup key={group.label} label={group.label}>{group.options.map((option) => <Form.Select.Option key={option.value} value={option.value}>{option.label}</Form.Select.Option>)}</Form.Select.OptGroup>)}
    </Form.Select>
    {result ? <Banner data-testid="ai-tier-current-test-result" description={`${result.errorSummary ? `${result.errorSummary} · ` : ""}${t("plugin.linapro-ai-core.invocation.fields.latencyMs")}: ${formatLatencyMs(result.latencyMs)}`} type={result.status === "success" ? "success" : "danger"} /> : null}
    <div className="ai-core-form-actions"><Button htmlType="reset">{t("plugin.linapro-ai-core.common.reset")}</Button><Button disabled={testing} loading={testing} onClick={() => void testCurrent()} theme="light" type="secondary">{t("plugin.linapro-ai-core.tier.actions.testDraft")}</Button><Button htmlType="submit" loading={saving} theme="solid" type="primary">{t("pages.common.save")}</Button></div>
  </Form>}</SideSheet>;
}
