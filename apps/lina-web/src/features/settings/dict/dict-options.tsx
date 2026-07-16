import Tag from "@douyinfe/semi-ui/lib/es/tag"; import type { TagColor } from "@douyinfe/semi-ui/lib/es/tag/interface"; import { useDictOptions } from "#/features/settings/dict/use-dict-options";
const colors: readonly TagColor[] = ["amber", "blue", "cyan", "green", "grey", "indigo", "orange", "pink", "purple", "red", "teal", "violet", "yellow"];
const semanticColors: Record<string, TagColor> = { danger: "red", default: "grey", info: "cyan", primary: "blue", success: "green", warning: "orange" };
function color(value: string): TagColor { return semanticColors[value] ?? (colors.includes(value as TagColor) ? value as TagColor : "blue"); }
export function DictTag({ dictType, value }: { dictType: string; value: string }) { const query = useDictOptions(dictType); const item = query.data?.find((candidate) => candidate.value === value); return <Tag className={item?.cssClass || undefined} color={color(item?.tagStyle || "blue")}>{item?.label ?? value}</Tag>; }
