// flow_create.go defines empty Flow creation under a visible project.

package v1

import "github.com/gogf/gf/v2/frame/g"

// CreateReq creates one empty Flow; graph content must be written through FlowMutation.
type CreateReq struct {
	g.Meta          `path:"/projects/{projectId}/flows" method:"post" tags:"TapCanvas Flows" summary:"Create a Flow" dc:"Create one empty revision-zero Flow under a visible project. Graph content, including initial imports, must be committed through FlowMutation v1." permission:"tapcanvas:flow:mutate"`
	ProjectId       string        `json:"projectId" v:"required|length:1,36" dc:"Visible ancestor project ID" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06215"`
	OwnerType       FlowOwnerType `json:"ownerType" v:"in:project,chapter" d:"project" dc:"Flow owner type: project or chapter; defaults to project" eg:"project"`
	OwnerResourceId string        `json:"ownerId" v:"length:0,36" dc:"Owner resource ID; defaults to projectId for project Flows and is required for chapter Flows" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06215"`
	Name            string        `json:"name" v:"required|length:1,200" dc:"Flow display name" eg:"Opening storyboard"`
	Description     string        `json:"description" v:"length:0,1000" dc:"Optional Flow description" eg:"Primary storyboard workspace"`
}

// CreateRes returns the created empty Flow at revision zero.
type CreateRes FlowItem
