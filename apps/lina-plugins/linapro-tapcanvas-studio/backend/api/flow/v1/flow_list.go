// flow_list.go defines the bounded visible Flow list contract.

package v1

import "github.com/gogf/gf/v2/frame/g"

// ListReq lists visible Flows across projects or inside one optional project.
type ListReq struct {
	g.Meta    `path:"/flows" method:"get" tags:"TapCanvas Flows" summary:"List visible Flows" dc:"List a bounded page of Flow summaries after applying the current Tenant and role data scope. Optional project filtering is performed in the database." permission:"tapcanvas:flow:view"`
	ProjectId string `json:"projectId" v:"length:0,36" dc:"Optional visible ancestor project ID; omit to list across visible projects" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06215"`
	PageNum   int    `json:"pageNum" v:"min:1" d:"1" dc:"One-based page number; defaults to 1" eg:"1"`
	PageSize  int    `json:"pageSize" v:"between:1,100" d:"20" dc:"Page size from 1 to 100; defaults to 20" eg:"20"`
}

// ListRes returns one bounded visible Flow page.
type ListRes struct {
	List     []*FlowSummary `json:"list" dc:"Visible Flow summaries without snapshots" eg:"[]"`
	Total    int            `json:"total" dc:"Visible Flow count after Tenant, data-scope, and project filtering" eg:"1"`
	PageNum  int            `json:"pageNum" dc:"Applied one-based page number" eg:"1"`
	PageSize int            `json:"pageSize" dc:"Applied page size" eg:"20"`
}
