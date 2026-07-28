// flow_delete.go defines visible Flow soft deletion.

package v1

import "github.com/gogf/gf/v2/frame/g"

// DeleteReq soft-deletes one visible Flow without deleting mutation or version audit rows.
type DeleteReq struct {
	g.Meta `path:"/flows/{flowId}" method:"delete" tags:"TapCanvas Flows" summary:"Delete a Flow" dc:"Soft-delete one visible Flow. Immutable mutation and version evidence remains retained and is never cascade-deleted." permission:"tapcanvas:flow:mutate"`
	FlowId string `json:"flowId" v:"required|length:1,36" dc:"Visible Flow ID" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06221"`
}

// DeleteRes is empty after successful soft deletion.
type DeleteRes struct{}
