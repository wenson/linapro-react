// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// FlowsDao is the data access object for the table tapcanvas_flows.
type FlowsDao struct {
	table    string             // table is the underlying table name of the DAO.
	group    string             // group is the database configuration group name of the current DAO.
	columns  FlowsColumns       // columns contains all the column names of Table for convenient usage.
	handlers []gdb.ModelHandler // handlers for customized model modification.
}

// FlowsColumns defines and stores column names for the table tapcanvas_flows.
type FlowsColumns struct {
	Id              string // Server-generated Flow ID
	TenantId        string // Owning LinaPro tenant ID
	ProjectId       string // Visible ancestor project ID
	OwnerId         string // Creating LinaPro user ID used for audit projection
	OwnerType       string // Flow owner type: project or chapter
	OwnerResourceId string // Project or chapter resource ID selected by owner_type
	Name            string // Flow display name
	Description     string // Flow description
	Snapshot        string // Current server-authoritative Flow snapshot
	Revision        string // Monotonic Flow mutation revision
	CreatedAt       string // Creation time
	UpdatedAt       string // Last update time
	DeletedAt       string // Soft deletion time
}

// flowsColumns holds the columns for the table tapcanvas_flows.
var flowsColumns = FlowsColumns{
	Id:              "id",
	TenantId:        "tenant_id",
	ProjectId:       "project_id",
	OwnerId:         "owner_id",
	OwnerType:       "owner_type",
	OwnerResourceId: "owner_resource_id",
	Name:            "name",
	Description:     "description",
	Snapshot:        "snapshot",
	Revision:        "revision",
	CreatedAt:       "created_at",
	UpdatedAt:       "updated_at",
	DeletedAt:       "deleted_at",
}

// NewFlowsDao creates and returns a new DAO object for table data access.
func NewFlowsDao(handlers ...gdb.ModelHandler) *FlowsDao {
	return &FlowsDao{
		group:    "default",
		table:    "tapcanvas_flows",
		columns:  flowsColumns,
		handlers: handlers,
	}
}

// DB retrieves and returns the underlying raw database management object of the current DAO.
func (dao *FlowsDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of the current DAO.
func (dao *FlowsDao) Table() string {
	return dao.table
}

// Columns returns all column names of the current DAO.
func (dao *FlowsDao) Columns() FlowsColumns {
	return dao.columns
}

// Group returns the database configuration group name of the current DAO.
func (dao *FlowsDao) Group() string {
	return dao.group
}

// Ctx creates and returns a Model for the current DAO. It automatically sets the context for the current operation.
func (dao *FlowsDao) Ctx(ctx context.Context) *gdb.Model {
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
func (dao *FlowsDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
