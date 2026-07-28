// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"time"
)

// Projects is the golang structure for table projects.
type Projects struct {
	Id          string     `json:"id"          orm:"id"          description:"Server-generated project ID"`
	TenantId    int64      `json:"tenantId"    orm:"tenant_id"   description:"Owning LinaPro tenant ID"`
	OwnerId     int64      `json:"ownerId"     orm:"owner_id"    description:"Owning LinaPro user ID used by data scope"`
	Name        string     `json:"name"        orm:"name"        description:"Project name"`
	Description string     `json:"description" orm:"description" description:"Project description"`
	CreatedAt   *time.Time `json:"createdAt"   orm:"created_at"  description:"Creation time"`
	UpdatedAt   *time.Time `json:"updatedAt"   orm:"updated_at"  description:"Last update time"`
	DeletedAt   *time.Time `json:"deletedAt"   orm:"deleted_at"  description:"Soft deletion time"`
}
