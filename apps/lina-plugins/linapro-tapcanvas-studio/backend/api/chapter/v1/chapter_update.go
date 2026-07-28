// chapter_update.go defines the chapter update contract.

package v1

import "github.com/gogf/gf/v2/frame/g"

// UpdateReq changes mutable fields of one visible chapter.
type UpdateReq struct {
	g.Meta    `path:"/chapters/{chapterId}" method:"put" tags:"TapCanvas Chapters" summary:"Update a project chapter" dc:"Update chapter content, workflow status, or display order after validating ancestor-project visibility." permission:"tapcanvas:project:update"`
	ChapterId string  `json:"chapterId" v:"required|length:1,36" dc:"Chapter ID" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06217"`
	Title     *string `json:"title" v:"length:1,200" dc:"Optional replacement chapter title" eg:"The First Meeting"`
	Summary   *string `json:"summary" v:"length:0,5000" dc:"Optional replacement chapter summary" eg:"The protagonists meet during a storm."`
	Status    *string `json:"status" dc:"Optional chapter workflow status: draft, planning, producing, review, approved, locked, or archived" eg:"planning"`
	SortOrder *int    `json:"sortOrder" v:"min:1" dc:"Optional positive project-local display order" eg:"2"`
}

// UpdateRes returns the updated chapter projection.
type UpdateRes ChapterItem
