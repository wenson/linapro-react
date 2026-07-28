// flow_update.go defines Flow metadata updates that cannot change graph content.

package v1

import "github.com/gogf/gf/v2/frame/g"

// UpdateReq updates mutable display metadata without changing the graph or revision.
type UpdateReq struct {
	g.Meta      `path:"/flows/{flowId}" method:"put" tags:"TapCanvas Flows" summary:"Update Flow metadata" dc:"Update a visible Flow name or description. This endpoint cannot update graph content, snapshot, revision, owner, Tenant, or actor fields." permission:"tapcanvas:flow:mutate"`
	FlowId      string  `json:"flowId" v:"required|length:1,36" dc:"Visible Flow ID" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06221"`
	Name        *string `json:"name" v:"length:1,200" dc:"Optional replacement Flow name" eg:"Approved storyboard"`
	Description *string `json:"description" v:"length:0,1000" dc:"Optional replacement Flow description" eg:"Final storyboard workspace"`
}

// UpdateRes returns the updated Flow and unchanged graph revision.
type UpdateRes FlowItem
