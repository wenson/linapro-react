// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// FlowVersionsDao is the data access object for the table tapcanvas_flow_versions.
type FlowVersionsDao struct {
	table    string              // table is the underlying table name of the DAO.
	group    string              // group is the database configuration group name of the current DAO.
	columns  FlowVersionsColumns // columns contains all the column names of Table for convenient usage.
	handlers []gdb.ModelHandler  // handlers for customized model modification.
}

// FlowVersionsColumns defines and stores column names for the table tapcanvas_flow_versions.
type FlowVersionsColumns struct {
	Id          string // Server-generated savepoint ID
	TenantId    string // Owning LinaPro tenant ID
	FlowId      string // Saved Flow ID
	Revision    string // Exact Flow revision captured by this savepoint
	Name        string // Savepoint display name
	Snapshot    string // Immutable Flow snapshot at the saved revision
	ActorType   string // Server-derived actor type: user or agent
	ActorId     string // Server-derived user or Agent run identity
	ActorUserId string // Current LinaPro user when available
	CreatedAt   string // Savepoint creation time
}

// flowVersionsColumns holds the columns for the table tapcanvas_flow_versions.
var flowVersionsColumns = FlowVersionsColumns{
	Id:          "id",
	TenantId:    "tenant_id",
	FlowId:      "flow_id",
	Revision:    "revision",
	Name:        "name",
	Snapshot:    "snapshot",
	ActorType:   "actor_type",
	ActorId:     "actor_id",
	ActorUserId: "actor_user_id",
	CreatedAt:   "created_at",
}

// NewFlowVersionsDao creates and returns a new DAO object for table data access.
func NewFlowVersionsDao(handlers ...gdb.ModelHandler) *FlowVersionsDao {
	return &FlowVersionsDao{
		group:    "default",
		table:    "tapcanvas_flow_versions",
		columns:  flowVersionsColumns,
		handlers: handlers,
	}
}

// DB retrieves and returns the underlying raw database management object of the current DAO.
func (dao *FlowVersionsDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of the current DAO.
func (dao *FlowVersionsDao) Table() string {
	return dao.table
}

// Columns returns all column names of the current DAO.
func (dao *FlowVersionsDao) Columns() FlowVersionsColumns {
	return dao.columns
}

// Group returns the database configuration group name of the current DAO.
func (dao *FlowVersionsDao) Group() string {
	return dao.group
}

// Ctx creates and returns a Model for the current DAO. It automatically sets the context for the current operation.
func (dao *FlowVersionsDao) Ctx(ctx context.Context) *gdb.Model {
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
func (dao *FlowVersionsDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
