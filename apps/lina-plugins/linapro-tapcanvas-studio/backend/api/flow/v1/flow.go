// flow.go defines response projections and the strict FlowMutation operation envelope shared by Flow APIs.

package v1

import (
	"bytes"
	"encoding/json"

	"github.com/gogf/gf/v2/errors/gerror"
)

// FlowOwnerType is the public Flow owner projection.
type FlowOwnerType string

const (
	// FlowOwnerTypeProject binds a Flow directly to its ancestor project.
	FlowOwnerTypeProject FlowOwnerType = "project"
	// FlowOwnerTypeChapter binds a Flow to a visible project chapter.
	FlowOwnerTypeChapter FlowOwnerType = "chapter"
)

// FlowViewport is the persisted React Flow viewport projection.
type FlowViewport struct {
	X    float64 `json:"x" dc:"Horizontal canvas offset" eg:"120"`
	Y    float64 `json:"y" dc:"Vertical canvas offset" eg:"80"`
	Zoom float64 `json:"zoom" dc:"Canvas zoom factor greater than zero" eg:"1"`
}

// FlowSnapshot is the current server-authoritative graph snapshot.
type FlowSnapshot struct {
	Nodes                 []map[string]any `json:"nodes" dc:"Validated React Flow node records" eg:"[]"`
	Edges                 []map[string]any `json:"edges" dc:"Validated React Flow edge records" eg:"[]"`
	Viewport              *FlowViewport    `json:"viewport" dc:"Optional persisted canvas viewport" eg:"null"`
	SceneCreationProgress any              `json:"sceneCreationProgress,omitempty" dc:"Optional bounded scene-creation progress metadata" eg:"null"`
}

// FlowSummary is one visible Flow list projection without the potentially large snapshot.
type FlowSummary struct {
	Id              string        `json:"id" dc:"Flow ID" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06221"`
	ProjectId       string        `json:"projectId" dc:"Visible ancestor project ID" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06215"`
	OwnerType       FlowOwnerType `json:"ownerType" dc:"Flow owner type: project or chapter" eg:"project"`
	OwnerResourceId string        `json:"ownerId" dc:"Project or chapter resource ID selected by ownerType" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06215"`
	Name            string        `json:"name" dc:"Flow display name" eg:"Opening storyboard"`
	Description     string        `json:"description" dc:"Flow description" eg:"Primary storyboard workspace"`
	Revision        int64         `json:"revision" dc:"Current monotonic Flow revision" eg:"12"`
	CreatedAt       *int64        `json:"createdAt" dc:"Creation time as Unix timestamp in milliseconds" eg:"1784170800000"`
	UpdatedAt       *int64        `json:"updatedAt" dc:"Last update time as Unix timestamp in milliseconds" eg:"1784171100000"`
}

// FlowItem is one visible Flow including its bounded current snapshot.
type FlowItem struct {
	FlowSummary
	Snapshot FlowSnapshot `json:"snapshot" dc:"Current server-authoritative Flow snapshot, capped at 20 MiB by default" eg:"{\"nodes\":[],\"edges\":[],\"viewport\":null}"`
}

// NodePositionInput identifies one node position inside node.moveBatch.
type NodePositionInput struct {
	NodeId   string       `json:"nodeId" dc:"Existing node ID" eg:"node-1"`
	Position FlowPosition `json:"position" dc:"Replacement node position" eg:"{\"x\":120,\"y\":80}"`
}

// FlowPosition is one finite two-dimensional canvas coordinate.
type FlowPosition struct {
	X float64 `json:"x" dc:"Horizontal canvas coordinate" eg:"120"`
	Y float64 `json:"y" dc:"Vertical canvas coordinate" eg:"80"`
}

// MutationOperationInput is the fixed union envelope accepted by FlowMutation v1.
// Custom JSON decoding rejects keys outside this published union before service validation.
type MutationOperationInput struct {
	Type      string                 `json:"type" dc:"Operation type: node.add, node.update, node.delete, node.moveBatch, edge.add, edge.update, edge.delete, group.update, or flow.metadata.update" eg:"node.update"`
	Node      map[string]any         `json:"node,omitempty" dc:"Complete node record for node.add" eg:"{\"id\":\"node-1\",\"type\":\"taskNode\",\"position\":{\"x\":120,\"y\":80},\"data\":{}}"`
	NodeId    string                 `json:"nodeId,omitempty" dc:"Target node ID for node.update or node.delete" eg:"node-1"`
	Positions []NodePositionInput    `json:"positions,omitempty" dc:"Bounded node position replacements for node.moveBatch" eg:"[{\"nodeId\":\"node-1\",\"position\":{\"x\":120,\"y\":80}}]"`
	Edge      map[string]any         `json:"edge,omitempty" dc:"Complete edge record for edge.add" eg:"{\"id\":\"edge-1\",\"source\":\"node-1\",\"target\":\"node-2\"}"`
	EdgeId    string                 `json:"edgeId,omitempty" dc:"Target edge ID for edge.update or edge.delete" eg:"edge-1"`
	GroupId   string                 `json:"groupId,omitempty" dc:"Target group node ID for group.update" eg:"group-1"`
	Patch     map[string]any         `json:"patch,omitempty" dc:"Operation-specific fixed-field patch; arbitrary JSON Patch paths are not accepted" eg:"{\"position\":{\"x\":120,\"y\":80}}"`
	present   map[string]struct{}
}

// UnmarshalJSON rejects operation fields outside the versioned union envelope.
func (in *MutationOperationInput) UnmarshalJSON(data []byte) error {
	type operationAlias MutationOperationInput
	var (
		decoded operationAlias
		fields  map[string]json.RawMessage
	)
	decoder := json.NewDecoder(bytes.NewReader(data))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&decoded); err != nil {
		return gerror.Wrap(err, "decode FlowMutation operation")
	}
	if err := json.Unmarshal(data, &fields); err != nil {
		return gerror.Wrap(err, "read FlowMutation operation fields")
	}
	*in = MutationOperationInput(decoded)
	in.present = make(map[string]struct{}, len(fields))
	for key := range fields {
		in.present[key] = struct{}{}
	}
	return nil
}

// PresentFields returns the exact JSON field names supplied by the caller.
func (in MutationOperationInput) PresentFields() []string {
	fields := make([]string, 0, len(in.present))
	for key := range in.present {
		fields = append(fields, key)
	}
	return fields
}

// MutationResult is the stable response returned for an original commit or idempotent replay.
type MutationResult struct {
	FlowId           string `json:"flowId" dc:"Mutated Flow ID" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06221"`
	MutationId       string `json:"mutationId" dc:"Caller-generated mutation idempotency key" eg:"01J2Z6S2K8F4Q5M7W9Y1A3B5C7"`
	BaseRevision     int64  `json:"baseRevision" dc:"Revision asserted by this mutation" eg:"12"`
	ResultRevision   int64  `json:"resultRevision" dc:"Revision committed by this mutation" eg:"13"`
	CommittedAt      *int64 `json:"committedAt" dc:"Original mutation commit time as Unix timestamp in milliseconds" eg:"1784171100000"`
	IdempotentReplay bool   `json:"idempotentReplay" dc:"Whether this response replays a previously committed identical mutation" eg:"false"`
}

// FlowVersionSummary is one bounded savepoint projection without its snapshot.
type FlowVersionSummary struct {
	Id          string `json:"id" dc:"Flow savepoint ID" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06231"`
	FlowId      string `json:"flowId" dc:"Owning Flow ID" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06221"`
	Revision    int64  `json:"revision" dc:"Exact Flow revision captured by this savepoint" eg:"13"`
	Name        string `json:"name" dc:"Savepoint display name" eg:"Storyboard approved"`
	ActorType   string `json:"actorType" dc:"Server-derived savepoint actor type: user or agent" eg:"user"`
	ActorId     string `json:"actorId" dc:"Server-derived user or Agent run identity" eg:"1"`
	ActorUserId *int64 `json:"actorUserId" dc:"Current LinaPro user ID when available" eg:"1"`
	CreatedAt   *int64 `json:"createdAt" dc:"Savepoint creation time as Unix timestamp in milliseconds" eg:"1784171100000"`
}

// FlowVersionItem is one visible savepoint including its immutable snapshot.
type FlowVersionItem struct {
	FlowVersionSummary
	Snapshot FlowSnapshot `json:"snapshot" dc:"Immutable Flow snapshot captured at the savepoint revision" eg:"{\"nodes\":[],\"edges\":[],\"viewport\":null}"`
}
