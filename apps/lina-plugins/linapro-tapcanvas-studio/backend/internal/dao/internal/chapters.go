// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// ChaptersDao is the data access object for the table tapcanvas_chapters.
type ChaptersDao struct {
	table    string             // table is the underlying table name of the DAO.
	group    string             // group is the database configuration group name of the current DAO.
	columns  ChaptersColumns    // columns contains all the column names of Table for convenient usage.
	handlers []gdb.ModelHandler // handlers for customized model modification.
}

// ChaptersColumns defines and stores column names for the table tapcanvas_chapters.
type ChaptersColumns struct {
	Id           string // Server-generated chapter ID
	TenantId     string // Owning LinaPro tenant ID
	ProjectId    string // Owning visible project ID
	OwnerId      string // Creating LinaPro user ID used for audit projection
	ChapterIndex string // Stable one-based chapter index inside the project
	Title        string // Chapter title
	Summary      string // Chapter summary
	Status       string // Chapter workflow status from tapcanvas_chapter_status
	SortOrder    string // Project-local display order
	LastWorkedAt string // Last time the chapter was opened for work
	CreatedAt    string // Creation time
	UpdatedAt    string // Last update time
	DeletedAt    string // Soft deletion time
}

// chaptersColumns holds the columns for the table tapcanvas_chapters.
var chaptersColumns = ChaptersColumns{
	Id:           "id",
	TenantId:     "tenant_id",
	ProjectId:    "project_id",
	OwnerId:      "owner_id",
	ChapterIndex: "chapter_index",
	Title:        "title",
	Summary:      "summary",
	Status:       "status",
	SortOrder:    "sort_order",
	LastWorkedAt: "last_worked_at",
	CreatedAt:    "created_at",
	UpdatedAt:    "updated_at",
	DeletedAt:    "deleted_at",
}

// NewChaptersDao creates and returns a new DAO object for table data access.
func NewChaptersDao(handlers ...gdb.ModelHandler) *ChaptersDao {
	return &ChaptersDao{
		group:    "default",
		table:    "tapcanvas_chapters",
		columns:  chaptersColumns,
		handlers: handlers,
	}
}

// DB retrieves and returns the underlying raw database management object of the current DAO.
func (dao *ChaptersDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of the current DAO.
func (dao *ChaptersDao) Table() string {
	return dao.table
}

// Columns returns all column names of the current DAO.
func (dao *ChaptersDao) Columns() ChaptersColumns {
	return dao.columns
}

// Group returns the database configuration group name of the current DAO.
func (dao *ChaptersDao) Group() string {
	return dao.group
}

// Ctx creates and returns a Model for the current DAO. It automatically sets the context for the current operation.
func (dao *ChaptersDao) Ctx(ctx context.Context) *gdb.Model {
	model := dao.DB().Model(dao.table)
	for _, handler := range dao.handlers {
		model = handler(model)
	}
	return model.Safe().Ctx(ctx)
}

// Transaction wraps the transaction logic using function f.
// It rolls back the transaction and returns the error if function f returns a non-nil error.
// It commits the transaction and returns nil if function f returns nil.
//
// Note: Do not commit or roll back the transaction in function f,
// as it is automatically handled by this function.
func (dao *ChaptersDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
