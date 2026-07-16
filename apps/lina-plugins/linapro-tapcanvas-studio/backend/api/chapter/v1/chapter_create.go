// chapter_create.go defines the project chapter creation contract.

package v1

import "github.com/gogf/gf/v2/frame/g"

// CreateReq creates one chapter under a visible project.
type CreateReq struct {
	g.Meta    `path:"/projects/{projectId}/chapters" method:"post" tags:"TapCanvas Chapters" summary:"Create a project chapter" dc:"Create one draft chapter under a visible project, assigning its stable index, display order, Tenant, and owner on the server." permission:"tapcanvas:project:update"`
	ProjectId string `json:"projectId" v:"required|length:1,36" dc:"Visible ancestor project ID" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06215"`
	Title     string `json:"title" v:"required|length:1,200" dc:"Chapter title" eg:"Opening"`
	Summary   string `json:"summary" v:"length:0,5000" dc:"Optional chapter summary" eg:"The protagonists meet for the first time."`
}

// CreateRes returns the created chapter projection.
type CreateRes ChapterItem
