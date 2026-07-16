// flow_project_list.go defines the nested project Flow list contract.

package v1

import "github.com/gogf/gf/v2/frame/g"

// ProjectListReq lists visible Flow summaries under one visible project.
type ProjectListReq struct {
	g.Meta    `path:"/projects/{projectId}/flows" method:"get" tags:"TapCanvas Flows" summary:"List project Flows" dc:"List a bounded page of Flow summaries only after the ancestor project is visible in the current Tenant and role data scope." permission:"tapcanvas:flow:view"`
	ProjectId string `json:"projectId" v:"required|length:1,36" dc:"Visible ancestor project ID" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06215"`
	PageNum   int    `json:"pageNum" v:"min:1" d:"1" dc:"One-based page number; defaults to 1" eg:"1"`
	PageSize  int    `json:"pageSize" v:"between:1,100" d:"20" dc:"Page size from 1 to 100; defaults to 20" eg:"20"`
}

// ProjectListRes returns one bounded visible project Flow page.
type ProjectListRes ListRes
