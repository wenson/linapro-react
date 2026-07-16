// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"time"

	"github.com/gogf/gf/v2/frame/g"
)

// Projects is the golang structure of table tapcanvas_projects for DAO operations like Where/Data.
type Projects struct {
	g.Meta      `orm:"table:tapcanvas_projects, do:true"`
	Id          any        // Server-generated project ID
	TenantId    any        // Owning LinaPro tenant ID
	OwnerId     any        // Owning LinaPro user ID used by data scope
	Name        any        // Project name
	Description any        // Project description
	CreatedAt   *time.Time // Creation time
	UpdatedAt   *time.Time // Last update time
	DeletedAt   *time.Time // Soft deletion time
}
