// chapter_delete.go defines the chapter deletion contract.

package v1

import "github.com/gogf/gf/v2/frame/g"

// DeleteReq soft-deletes one visible chapter.
type DeleteReq struct {
	g.Meta    `path:"/chapters/{chapterId}" method:"delete" tags:"TapCanvas Chapters" summary:"Delete a project chapter" dc:"Soft-delete one chapter after validating current Tenant, role data scope, and ancestor project visibility." permission:"tapcanvas:project:update"`
	ChapterId string `json:"chapterId" v:"required|length:1,36" dc:"Chapter ID" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06217"`
}

// DeleteRes identifies the deleted chapter.
type DeleteRes struct {
	Id string `json:"id" dc:"Deleted chapter ID" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06217"`
}
