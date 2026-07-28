// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"time"

	"github.com/gogf/gf/v2/frame/g"
)

// Chapters is the golang structure of table tapcanvas_chapters for DAO operations like Where/Data.
type Chapters struct {
	g.Meta       `orm:"table:tapcanvas_chapters, do:true"`
	Id           any        // Server-generated chapter ID
	TenantId     any        // Owning LinaPro tenant ID
	ProjectId    any        // Owning visible project ID
	OwnerId      any        // Creating LinaPro user ID used for audit projection
	ChapterIndex any        // Stable one-based chapter index inside the project
	Title        any        // Chapter title
	Summary      any        // Chapter summary
	Status       any        // Chapter workflow status from tapcanvas_chapter_status
	SortOrder    any        // Project-local display order
	LastWorkedAt *time.Time // Last time the chapter was opened for work
	CreatedAt    *time.Time // Creation time
	UpdatedAt    *time.Time // Last update time
	DeletedAt    *time.Time // Soft deletion time
}
