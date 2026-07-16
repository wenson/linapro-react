import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { parseJsonPreview } from "#/shared/json";
export function JsonPreview({ value }: { value: string }) { const result = parseJsonPreview(value); return <div className="json-preview">{result.error ? <Typography.Text role="alert" type="warning">{result.error}</Typography.Text> : null}<pre>{result.formatted}</pre></div>; }
