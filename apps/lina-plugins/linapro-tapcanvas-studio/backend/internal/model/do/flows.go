// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"time"

	"github.com/gogf/gf/v2/frame/g"
)

// Flows is the golang structure of table tapcanvas_flows for DAO operations like Where/Data.
type Flows struct {
	g.Meta          `orm:"table:tapcanvas_flows, do:true"`
	Id              any        // Server-generated Flow ID
	TenantId        any        // Owning LinaPro tenant ID
	ProjectId       any        // Visible ancestor project ID
	OwnerId         any        // Creating LinaPro user ID used for audit projection
	OwnerType       any        // Flow owner type: project or chapter
	OwnerResourceId any        // Project or chapter resource ID selected by owner_type
	Name            any        // Flow display name
	Description     any        // Flow description
	Snapshot        any        // Current server-authoritative Flow snapshot
	Revision        any        // Monotonic Flow mutation revision
	CreatedAt       *time.Time // Creation time
	UpdatedAt       *time.Time // Last update time
	DeletedAt       *time.Time // Soft deletion time
}
