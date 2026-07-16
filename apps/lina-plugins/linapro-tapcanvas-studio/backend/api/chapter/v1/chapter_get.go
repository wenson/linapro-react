// chapter_get.go defines the chapter detail contract.

package v1

import "github.com/gogf/gf/v2/frame/g"

// GetReq loads one chapter only when its ancestor project remains visible.
type GetReq struct {
	g.Meta    `path:"/chapters/{chapterId}" method:"get" tags:"TapCanvas Chapters" summary:"Get a project chapter" dc:"Get one non-deleted chapter after validating the current Tenant, role data scope, and ancestor project visibility." permission:"tapcanvas:project:view"`
	ChapterId string `json:"chapterId" v:"required|length:1,36" dc:"Chapter ID" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06217"`
}

// GetRes returns one visible chapter projection.
type GetRes ChapterItem
