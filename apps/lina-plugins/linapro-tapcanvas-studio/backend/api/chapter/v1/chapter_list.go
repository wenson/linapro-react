// chapter_list.go defines the bounded project chapter list contract.

package v1

import "github.com/gogf/gf/v2/frame/g"

// ListReq lists chapters only after the ancestor project is visible.
type ListReq struct {
	g.Meta    `path:"/projects/{projectId}/chapters" method:"get" tags:"TapCanvas Chapters" summary:"List project chapters" dc:"List up to 200 non-deleted chapters after applying current Tenant, role data scope, and ancestor-project visibility." permission:"tapcanvas:project:view"`
	ProjectId string `json:"projectId" v:"required|length:1,36" dc:"Visible ancestor project ID" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06215"`
}

// ListRes returns the bounded chapter list for one project.
type ListRes struct {
	ProjectId string         `json:"projectId" dc:"Ancestor project ID" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06215"`
	List      []*ChapterItem `json:"list" dc:"Visible chapters in display order, capped at 200 items" eg:"[]"`
}
