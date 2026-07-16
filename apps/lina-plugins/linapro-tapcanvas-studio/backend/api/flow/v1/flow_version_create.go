// flow_version_create.go defines controlled current-revision savepoint creation.

package v1

import "github.com/gogf/gf/v2/frame/g"

// VersionCreateReq captures the current visible Flow revision as one immutable savepoint.
type VersionCreateReq struct {
	g.Meta `path:"/flows/{flowId}/versions" method:"post" tags:"TapCanvas Flow Versions" summary:"Create a Flow savepoint" dc:"Capture the current visible Flow revision and snapshot as one controlled immutable savepoint. Repeating the action at the same revision returns the existing savepoint." permission:"tapcanvas:flow:mutate"`
	FlowId string `json:"flowId" v:"required|length:1,36" dc:"Visible Flow ID" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06221"`
	Name   string `json:"name" v:"required|length:1,200" dc:"Savepoint display name" eg:"Storyboard approved"`
}

// VersionCreateRes returns the created or existing current-revision savepoint.
type VersionCreateRes FlowVersionItem
