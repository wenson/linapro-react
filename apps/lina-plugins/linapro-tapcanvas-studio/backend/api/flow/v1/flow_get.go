// flow_get.go defines current Flow snapshot retrieval.

package v1

import "github.com/gogf/gf/v2/frame/g"

// GetReq retrieves one visible Flow and its current snapshot.
type GetReq struct {
	g.Meta `path:"/flows/{flowId}" method:"get" tags:"TapCanvas Flows" summary:"Get a Flow" dc:"Return one visible Flow, current revision, and bounded server-authoritative snapshot after applying Tenant, data-scope, and ancestor visibility." permission:"tapcanvas:flow:view"`
	FlowId string `json:"flowId" v:"required|length:1,36" dc:"Visible Flow ID" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06221"`
}

// GetRes returns one current visible Flow.
type GetRes FlowItem
