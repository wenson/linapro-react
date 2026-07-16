// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"time"
)

// Chapters is the golang structure for table chapters.
type Chapters struct {
	Id           string     `json:"id"           orm:"id"             description:"Server-generated chapter ID"`
	TenantId     int64      `json:"tenantId"     orm:"tenant_id"      description:"Owning LinaPro tenant ID"`
	ProjectId    string     `json:"projectId"    orm:"project_id"     description:"Owning visible project ID"`
	OwnerId      int64      `json:"ownerId"      orm:"owner_id"       description:"Creating LinaPro user ID used for audit projection"`
	ChapterIndex int        `json:"chapterIndex" orm:"chapter_index"  description:"Stable one-based chapter index inside the project"`
	Title        string     `json:"title"        orm:"title"          description:"Chapter title"`
	Summary      string     `json:"summary"      orm:"summary"        description:"Chapter summary"`
	Status       string     `json:"status"       orm:"status"         description:"Chapter workflow status from tapcanvas_chapter_status"`
	SortOrder    int        `json:"sortOrder"    orm:"sort_order"     description:"Project-local display order"`
	LastWorkedAt *time.Time `json:"lastWorkedAt" orm:"last_worked_at" description:"Last time the chapter was opened for work"`
	CreatedAt    *time.Time `json:"createdAt"    orm:"created_at"     description:"Creation time"`
	UpdatedAt    *time.Time `json:"updatedAt"    orm:"updated_at"     description:"Last update time"`
	DeletedAt    *time.Time `json:"deletedAt"    orm:"deleted_at"     description:"Soft deletion time"`
}
