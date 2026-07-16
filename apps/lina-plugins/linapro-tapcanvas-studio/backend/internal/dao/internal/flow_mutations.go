// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// FlowMutationsDao is the data access object for the table tapcanvas_flow_mutations.
type FlowMutationsDao struct {
	table    string               // table is the underlying table name of the DAO.
	group    string               // group is the database configuration group name of the current DAO.
	columns  FlowMutationsColumns // columns contains all the column names of Table for convenient usage.
	handlers []gdb.ModelHandler   // handlers for customized model modification.
}

// FlowMutationsColumns defines and stores column names for the table tapcanvas_flow_mutations.
type FlowMutationsColumns struct {
	Id              string // Server-generated mutation audit row ID
	TenantId        string // Owning LinaPro tenant ID
	FlowId          string // Mutated Flow ID
	MutationId      string // Caller-generated idempotency key scoped to one Flow
	ProtocolVersion string // FlowMutation protocol version
	RequestDigest   string // SHA-256 digest of canonical mutation input
	RequestBytes    string // Canonical request size in bytes
	BaseRevision    string // Revision asserted by the caller
	ResultRevision  string // Revision committed by this mutation
	ActorType       string // Server-derived actor type: user or agent
	ActorId         string // Server-derived user or Agent run identity
	ActorUserId     string // Current LinaPro user when available
	Operations      string // Validated FlowMutation operations retained for audit
	CreatedAt       string // Mutation commit time
}

// flowMutationsColumns holds the columns for the table tapcanvas_flow_mutations.
var flowMutationsColumns = FlowMutationsColumns{
	Id:              "id",
	TenantId:        "tenant_id",
	FlowId:          "flow_id",
	MutationId:      "mutation_id",
	ProtocolVersion: "protocol_version",
	RequestDigest:   "request_digest",
	RequestBytes:    "request_bytes",
	BaseRevision:    "base_revision",
	ResultRevision:  "result_revision",
	ActorType:       "actor_type",
	ActorId:         "actor_id",
	ActorUserId:     "actor_user_id",
	Operations:      "operations",
	CreatedAt:       "created_at",
}

// NewFlowMutationsDao creates and returns a new DAO object for table data access.
func NewFlowMutationsDao(handlers ...gdb.ModelHandler) *FlowMutationsDao {
	return &FlowMutationsDao{
		group:    "default",
		table:    "tapcanvas_flow_mutations",
		columns:  flowMutationsColumns,
		handlers: handlers,
	}
}

// DB retrieves and returns the underlying raw database management object of the current DAO.
func (dao *FlowMutationsDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of the current DAO.
func (dao *FlowMutationsDao) Table() string {
	return dao.table
}

// Columns returns all column names of the current DAO.
func (dao *FlowMutationsDao) Columns() FlowMutationsColumns {
	return dao.columns
}

// Group returns the database configuration group name of the current DAO.
func (dao *FlowMutationsDao) Group() string {
	return dao.group
}

// Ctx creates and returns a Model for the current DAO. It automatically sets the context for the current operation.
func (dao *FlowMutationsDao) Ctx(ctx context.Context) *gdb.Model {
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
func (dao *FlowMutationsDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
