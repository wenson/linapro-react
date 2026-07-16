// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"time"
)

// FlowVersions is the golang structure for table flow_versions.
type FlowVersions struct {
	Id          string     `json:"id"          orm:"id"            description:"Server-generated savepoint ID"`
	TenantId    int64      `json:"tenantId"    orm:"tenant_id"     description:"Owning LinaPro tenant ID"`
	FlowId      string     `json:"flowId"      orm:"flow_id"       description:"Saved Flow ID"`
	Revision    int64      `json:"revision"    orm:"revision"      description:"Exact Flow revision captured by this savepoint"`
	Name        string     `json:"name"        orm:"name"          description:"Savepoint display name"`
	Snapshot    string     `json:"snapshot"    orm:"snapshot"      description:"Immutable Flow snapshot at the saved revision"`
	ActorType   string     `json:"actorType"   orm:"actor_type"    description:"Server-derived actor type: user or agent"`
	ActorId     string     `json:"actorId"     orm:"actor_id"      description:"Server-derived user or Agent run identity"`
	ActorUserId int64      `json:"actorUserId" orm:"actor_user_id" description:"Current LinaPro user when available"`
	CreatedAt   *time.Time `json:"createdAt"   orm:"created_at"    description:"Savepoint creation time"`
}
