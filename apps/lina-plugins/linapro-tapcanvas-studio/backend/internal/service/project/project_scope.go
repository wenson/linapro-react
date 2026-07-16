// project_scope.go resolves permission, Tenant, and role data-scope predicates.

package project

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"

	"lina-core/pkg/bizerr"
	"lina-core/pkg/plugin/capability/authcap/authz"
	"lina-plugin-linapro-tapcanvas-studio/backend/internal/dao"
)

// projectPermission identifies one governed project permission.
type projectPermission string

const (
	permissionView   projectPermission = "tapcanvas:project:view"
	permissionCreate projectPermission = "tapcanvas:project:create"
	permissionUpdate projectPermission = "tapcanvas:project:update"
	permissionDelete projectPermission = "tapcanvas:project:delete"
)

// roleDataScope mirrors the stable role data-scope values carried by bizctx.
type roleDataScope int

const (
	dataScopeNone   roleDataScope = 0
	dataScopeAll    roleDataScope = 1
	dataScopeTenant roleDataScope = 2
	dataScopeDept   roleDataScope = 3
	dataScopeSelf   roleDataScope = 4
)

// requestScope is the validated current request ownership boundary.
type requestScope struct {
	TenantID int64
	UserID   int64
	Scope    roleDataScope
}

// ensurePermission validates service-level callers in addition to route middleware.
func (s *serviceImpl) ensurePermission(ctx context.Context, permission projectPermission) error {
	if s == nil || s.authzSvc == nil {
		return bizerr.NewCode(CodeForbidden)
	}
	allowed, err := s.authzSvc.HasPermission(ctx, authz.PermissionKey(permission))
	if err != nil {
		return err
	}
	if !allowed {
		return bizerr.NewCode(CodeForbidden)
	}
	return nil
}

// currentScope validates that Studio runs inside one concrete Tenant.
func (s *serviceImpl) currentScope(ctx context.Context) (*requestScope, error) {
	if s == nil || s.bizCtxSvc == nil || s.tenantSvc == nil || s.tenantSvc.Filter() == nil {
		return nil, bizerr.NewCode(CodeContextRequired)
	}
	current := s.bizCtxSvc.Current(ctx)
	tenantContext := s.tenantSvc.Filter().Context(ctx)
	if current.UserID <= 0 || current.TenantID <= 0 || tenantContext.TenantID <= 0 || current.TenantID != tenantContext.TenantID || current.PlatformBypass || tenantContext.PlatformBypass {
		return nil, bizerr.NewCode(CodeContextRequired)
	}
	if current.DataScopeUnsupported {
		return nil, bizerr.NewCode(CodeForbidden)
	}
	scope := roleDataScope(current.DataScope)
	if current.IsSuperAdmin {
		scope = dataScopeTenant
	}
	return &requestScope{TenantID: int64(current.TenantID), UserID: int64(current.UserID), Scope: scope}, nil
}

// visibleModel applies Tenant and role data scope in the database query.
func (s *serviceImpl) visibleModel(ctx context.Context) (*gdb.Model, *requestScope, bool, error) {
	if s == nil || s.db == nil {
		return nil, nil, false, bizerr.NewCode(CodeContextRequired)
	}
	scope, err := s.currentScope(ctx)
	if err != nil {
		return nil, nil, false, err
	}
	cols := dao.Projects.Columns()
	model := s.db.Model(dao.Projects.Table()).Safe().Ctx(ctx).Where(cols.TenantId, scope.TenantID)
	if dataScopeDenied(scope.Scope) {
		return model, scope, true, nil
	}
	switch scope.Scope {
	case dataScopeAll, dataScopeTenant:
		return model, scope, false, nil
	case dataScopeSelf:
		return model.Where(cols.OwnerId, scope.UserID), scope, false, nil
	default:
		return model, scope, true, nil
	}
}

// dataScopeDenied reports scopes that must return no project rows.
func dataScopeDenied(scope roleDataScope) bool {
	return scope != dataScopeAll && scope != dataScopeTenant && scope != dataScopeSelf
}
