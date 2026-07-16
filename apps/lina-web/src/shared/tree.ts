export interface TreeLike<T> { children?: T[] }
export interface SemiTreeNode { children?: SemiTreeNode[]; key: string; label: string; value: number }
export function flattenTree<T extends TreeLike<T>>(nodes: readonly T[]): T[] { return nodes.flatMap((node) => [node, ...flattenTree(node.children ?? [])]); }
export function filterTree<T extends TreeLike<T>>(nodes: readonly T[], keep: (node: T) => boolean): T[] { return nodes.filter(keep).map((node) => ({ ...node, children: filterTree(node.children ?? [], keep) })); }
export function toSemiTree<T extends TreeLike<T>>(nodes: readonly T[], getId: (node: T) => number, getLabel: (node: T) => string): SemiTreeNode[] { return nodes.map((node) => ({ children: toSemiTree(node.children ?? [], getId, getLabel), key: String(getId(node)), label: getLabel(node), value: getId(node) })); }
export function descendantIds<T extends TreeLike<T>>(nodes: readonly T[], getId: (node: T) => number, id: number): Set<number> { const target = flattenTree(nodes).find((node) => getId(node) === id); return new Set(target ? flattenTree(target.children ?? []).map(getId).concat(id) : [id]); }
