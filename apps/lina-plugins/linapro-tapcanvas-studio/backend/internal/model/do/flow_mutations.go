// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"time"

	"github.com/gogf/gf/v2/frame/g"
)

// FlowMutations is the golang structure of table tapcanvas_flow_mutations for DAO operations like Where/Data.
type FlowMutations struct {
	g.Meta          `orm:"table:tapcanvas_flow_mutations, do:true"`
	Id              any        // Server-generated mutation audit row ID
	TenantId        any        // Owning LinaPro tenant ID
	FlowId          any        // Mutated Flow ID
	MutationId      any        // Caller-generated idempotency key scoped to one Flow
	ProtocolVersion any        // FlowMutation protocol version
	RequestDigest   any        // SHA-256 digest of canonical mutation input
	RequestBytes    any        // Canonical request size in bytes
	BaseRevision    any        // Revision asserted by the caller
	ResultRevision  any        // Revision committed by this mutation
	ActorType       any        // Server-derived actor type: user or agent
	ActorId         any        // Server-derived user or Agent run identity
	ActorUserId     any        // Current LinaPro user when available
	Operations      any        // Validated FlowMutation operations retained for audit
	CreatedAt       *time.Time // Mutation commit time
}
