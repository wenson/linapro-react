// chapter_reorder.go defines the atomic chapter ordering contract.

package v1

import "github.com/gogf/gf/v2/frame/g"

// ReorderReq replaces the complete visible chapter order for one project.
type ReorderReq struct {
	g.Meta     `path:"/projects/{projectId}/chapters/order" method:"put" tags:"TapCanvas Chapters" summary:"Reorder project chapters" dc:"Atomically replace the complete order of up to 200 visible chapters; duplicate, missing, extra, or out-of-scope chapter IDs reject the entire request." permission:"tapcanvas:project:update"`
	ProjectId  string   `json:"projectId" v:"required|length:1,36" dc:"Visible ancestor project ID" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06215"`
	ChapterIds []string `json:"chapterIds" v:"required|length:1,200" dc:"Complete ordered chapter ID list; every current visible chapter must appear exactly once" eg:"[019c4b38-4e49-7ce2-b4f6-d2bb41c06217]"`
}

// ReorderRes returns the chapters in their persisted order.
type ReorderRes struct {
	ProjectId string         `json:"projectId" dc:"Ancestor project ID" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06215"`
	List      []*ChapterItem `json:"list" dc:"Visible chapters after the atomic reorder" eg:"[]"`
}
