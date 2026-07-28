// flow_mutate.go defines the versioned, bounded, idempotent Flow write contract.

package v1

import "github.com/gogf/gf/v2/frame/g"

// MutateReq applies one FlowMutation v1 request.
type MutateReq struct {
	g.Meta       `path:"/flows/{flowId}/mutations" method:"post" tags:"TapCanvas Flows" summary:"Apply FlowMutation v1" dc:"Atomically validate and apply at most 200 fixed Flow operations against one visible base revision. Requests are capped at 1 MiB and resulting snapshots at 20 MiB by default. Actor identity is always derived by the server." permission:"tapcanvas:flow:mutate"`
	FlowId       string                   `json:"flowId" v:"required|length:1,36" dc:"Visible Flow ID" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06221"`
	Version      string                   `json:"version" v:"required|in:v1" dc:"FlowMutation protocol version; only v1 is accepted" eg:"v1"`
	MutationId   string                   `json:"mutationId" v:"required|length:1,128" dc:"Caller-generated idempotency key scoped to this Flow" eg:"01J2Z6S2K8F4Q5M7W9Y1A3B5C7"`
	BaseRevision int64                    `json:"baseRevision" v:"min:0" dc:"Current revision observed by the caller" eg:"12"`
	Operations   []MutationOperationInput `json:"operations" v:"required|length:1,200" dc:"Ordered fixed FlowMutation v1 operations; unknown fields, JSON Patch paths, scripts, expressions, and actor fields are rejected" eg:"[{\"type\":\"node.moveBatch\",\"positions\":[{\"nodeId\":\"node-1\",\"position\":{\"x\":120,\"y\":80}}]}]"`
}

// MutateRes returns the stable original commit result or an idempotent replay.
type MutateRes MutationResult
