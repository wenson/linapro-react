// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"time"

	"github.com/gogf/gf/v2/frame/g"
)

// FlowVersions is the golang structure of table tapcanvas_flow_versions for DAO operations like Where/Data.
type FlowVersions struct {
	g.Meta      `orm:"table:tapcanvas_flow_versions, do:true"`
	Id          any        // Server-generated savepoint ID
	TenantId    any        // Owning LinaPro tenant ID
	FlowId      any        // Saved Flow ID
	Revision    any        // Exact Flow revision captured by this savepoint
	Name        any        // Savepoint display name
	Snapshot    any        // Immutable Flow snapshot at the saved revision
	ActorType   any        // Server-derived actor type: user or agent
	ActorId     any        // Server-derived user or Agent run identity
	ActorUserId any        // Current LinaPro user when available
	CreatedAt   *time.Time // Savepoint creation time
}
