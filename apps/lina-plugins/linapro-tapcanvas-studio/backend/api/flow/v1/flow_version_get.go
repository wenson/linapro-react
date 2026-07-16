// flow_version_get.go defines retrieval of one immutable savepoint snapshot.

package v1

import "github.com/gogf/gf/v2/frame/g"

// VersionGetReq retrieves one visible savepoint and its immutable snapshot.
type VersionGetReq struct {
	g.Meta   `path:"/flows/{flowId}/versions/{versionId}" method:"get" tags:"TapCanvas Flow Versions" summary:"Get a Flow savepoint" dc:"Return one immutable savepoint snapshot after validating the current Flow, Tenant, role data scope, and ancestor project visibility." permission:"tapcanvas:flow:view"`
	FlowId   string `json:"flowId" v:"required|length:1,36" dc:"Visible Flow ID" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06221"`
	VersionId string `json:"versionId" v:"required|length:1,36" dc:"Visible Flow savepoint ID" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06231"`
}

// VersionGetRes returns one immutable Flow savepoint.
type VersionGetRes FlowVersionItem
