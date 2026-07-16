// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"time"
)

// Flows is the golang structure for table flows.
type Flows struct {
	Id              string     `json:"id"              orm:"id"                description:"Server-generated Flow ID"`
	TenantId        int64      `json:"tenantId"        orm:"tenant_id"         description:"Owning LinaPro tenant ID"`
	ProjectId       string     `json:"projectId"       orm:"project_id"        description:"Visible ancestor project ID"`
	OwnerId         int64      `json:"ownerId"         orm:"owner_id"          description:"Creating LinaPro user ID used for audit projection"`
	OwnerType       string     `json:"ownerType"       orm:"owner_type"        description:"Flow owner type: project or chapter"`
	OwnerResourceId string     `json:"ownerResourceId" orm:"owner_resource_id" description:"Project or chapter resource ID selected by owner_type"`
	Name            string     `json:"name"            orm:"name"              description:"Flow display name"`
	Description     string     `json:"description"     orm:"description"       description:"Flow description"`
	Snapshot        string     `json:"snapshot"        orm:"snapshot"          description:"Current server-authoritative Flow snapshot"`
	Revision        int64      `json:"revision"        orm:"revision"          description:"Monotonic Flow mutation revision"`
	CreatedAt       *time.Time `json:"createdAt"       orm:"created_at"        description:"Creation time"`
	UpdatedAt       *time.Time `json:"updatedAt"       orm:"updated_at"        description:"Last update time"`
	DeletedAt       *time.Time `json:"deletedAt"       orm:"deleted_at"        description:"Soft deletion time"`
}
