// flow_version_list.go defines bounded Flow savepoint listing.

package v1

import "github.com/gogf/gf/v2/frame/g"

// VersionListReq lists savepoint metadata without loading snapshots.
type VersionListReq struct {
	g.Meta   `path:"/flows/{flowId}/versions" method:"get" tags:"TapCanvas Flow Versions" summary:"List Flow savepoints" dc:"List a bounded page of immutable savepoint metadata for one visible Flow. Snapshot payloads are excluded to avoid per-row large-object loading." permission:"tapcanvas:flow:view"`
	FlowId   string `json:"flowId" v:"required|length:1,36" dc:"Visible Flow ID" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06221"`
	PageNum  int    `json:"pageNum" v:"min:1" d:"1" dc:"One-based page number; defaults to 1" eg:"1"`
	PageSize int    `json:"pageSize" v:"between:1,100" d:"20" dc:"Page size from 1 to 100; defaults to 20" eg:"20"`
}

// VersionListRes returns bounded savepoint metadata.
type VersionListRes struct {
	List     []*FlowVersionSummary `json:"list" dc:"Visible Flow savepoint summaries without snapshots" eg:"[]"`
	Total    int                   `json:"total" dc:"Total savepoint count for this visible Flow" eg:"1"`
	PageNum  int                   `json:"pageNum" dc:"Applied one-based page number" eg:"1"`
	PageSize int                   `json:"pageSize" dc:"Applied page size" eg:"20"`
}
