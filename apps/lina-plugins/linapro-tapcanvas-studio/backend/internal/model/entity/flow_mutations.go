// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"time"
)

// FlowMutations is the golang structure for table flow_mutations.
type FlowMutations struct {
	Id              string     `json:"id"              orm:"id"               description:"Server-generated mutation audit row ID"`
	TenantId        int64      `json:"tenantId"        orm:"tenant_id"        description:"Owning LinaPro tenant ID"`
	FlowId          string     `json:"flowId"          orm:"flow_id"          description:"Mutated Flow ID"`
	MutationId      string     `json:"mutationId"      orm:"mutation_id"      description:"Caller-generated idempotency key scoped to one Flow"`
	ProtocolVersion string     `json:"protocolVersion" orm:"protocol_version" description:"FlowMutation protocol version"`
	RequestDigest   string     `json:"requestDigest"   orm:"request_digest"   description:"SHA-256 digest of canonical mutation input"`
	RequestBytes    int        `json:"requestBytes"    orm:"request_bytes"    description:"Canonical request size in bytes"`
	BaseRevision    int64      `json:"baseRevision"    orm:"base_revision"    description:"Revision asserted by the caller"`
	ResultRevision  int64      `json:"resultRevision"  orm:"result_revision"  description:"Revision committed by this mutation"`
	ActorType       string     `json:"actorType"       orm:"actor_type"       description:"Server-derived actor type: user or agent"`
	ActorId         string     `json:"actorId"         orm:"actor_id"         description:"Server-derived user or Agent run identity"`
	ActorUserId     int64      `json:"actorUserId"     orm:"actor_user_id"    description:"Current LinaPro user when available"`
	Operations      string     `json:"operations"      orm:"operations"       description:"Validated FlowMutation operations retained for audit"`
	CreatedAt       *time.Time `json:"createdAt"       orm:"created_at"       description:"Mutation commit time"`
}
