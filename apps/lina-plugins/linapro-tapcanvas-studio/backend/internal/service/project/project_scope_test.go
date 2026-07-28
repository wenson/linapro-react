// project_scope_test.go verifies fail-closed Tenant, permission, and data-scope resolution.

package project

import (
	"context"
	"testing"

	"lina-core/pkg/bizerr"
	"lina-core/pkg/plugin/capability/authcap/authz"
	"lina-core/pkg/plugin/capability/bizctxcap"
	"lina-core/pkg/plugin/capability/tenantcap"
)

// projectTestBizCtx returns one deterministic request snapshot.
type projectTestBizCtx struct {
	current bizctxcap.CurrentContext
}

func (s projectTestBizCtx) Current(context.Context) bizctxcap.CurrentContext { return s.current }

// projectTestTenantFilter returns one deterministic tenant-filter snapshot.
type projectTestTenantFilter struct {
	current tenantcap.TenantFilterContext
}

func (s projectTestTenantFilter) Context(context.Context) tenantcap.TenantFilterContext {
	return s.current
}

// projectTestTenant exposes only the filter slice used by the project service.
type projectTestTenant struct {
	tenantcap.Service
	filter tenantcap.FilterService
}

func (s projectTestTenant) Filter() tenantcap.FilterService { return s.filter }

// projectTestAuthz exposes one deterministic permission decision.
type projectTestAuthz struct {
	authz.Service
	allowed bool
}

func (s projectTestAuthz) HasPermission(context.Context, authz.PermissionKey) (bool, error) {
	return s.allowed, nil
}

// TestCurrentScopeModes verifies all/tenant/self continue and department/none fail closed.
func TestCurrentScopeModes(t *testing.T) {
	tests := []struct {
		name      string
		dataScope int
		wantEmpty bool
	}{
		{name: "all", dataScope: int(dataScopeAll), wantEmpty: false},
		{name: "tenant", dataScope: int(dataScopeTenant), wantEmpty: false},
		{name: "self", dataScope: int(dataScopeSelf), wantEmpty: false},
		{name: "department", dataScope: int(dataScopeDept), wantEmpty: true},
		{name: "none", dataScope: int(dataScopeNone), wantEmpty: true},
		{name: "unknown", dataScope: 99, wantEmpty: true},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			svc := &serviceImpl{
				bizCtxSvc: projectTestBizCtx{current: bizctxcap.CurrentContext{UserID: 7, TenantID: 11, DataScope: test.dataScope}},
				tenantSvc: projectTestTenant{filter: projectTestTenantFilter{current: tenantcap.TenantFilterContext{UserID: 7, TenantID: 11}}},
			}
			scope, err := svc.currentScope(context.Background())
			if err != nil {
				t.Fatalf("currentScope returned error: %v", err)
			}
			empty := dataScopeDenied(scope.Scope)
			if empty != test.wantEmpty || scope.TenantID != 11 || scope.UserID != 7 {
				t.Fatalf("unexpected scope=%+v empty=%v", scope, empty)
			}
		})
	}
}

// TestCurrentScopeRejectsCrossTenantAndUnsupportedScope verifies hard isolation failures.
func TestCurrentScopeRejectsCrossTenantAndUnsupportedScope(t *testing.T) {
	tests := []struct {
		name    string
		current bizctxcap.CurrentContext
		filter  tenantcap.TenantFilterContext
		code    any
	}{
		{
			name:    "cross tenant",
			current: bizctxcap.CurrentContext{UserID: 7, TenantID: 11, DataScope: int(dataScopeTenant)},
			filter:  tenantcap.TenantFilterContext{UserID: 7, TenantID: 12},
			code:    CodeContextRequired,
		},
		{
			name:    "unsupported scope",
			current: bizctxcap.CurrentContext{UserID: 7, TenantID: 11, DataScopeUnsupported: true},
			filter:  tenantcap.TenantFilterContext{UserID: 7, TenantID: 11},
			code:    CodeForbidden,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			svc := &serviceImpl{
				bizCtxSvc: projectTestBizCtx{current: test.current},
				tenantSvc: projectTestTenant{filter: projectTestTenantFilter{current: test.filter}},
			}
			_, err := svc.currentScope(context.Background())
			switch test.code {
			case CodeContextRequired:
				if !bizerr.Is(err, CodeContextRequired) {
					t.Fatalf("expected context-required error, got %v", err)
				}
			case CodeForbidden:
				if !bizerr.Is(err, CodeForbidden) {
					t.Fatalf("expected forbidden error, got %v", err)
				}
			}
		})
	}
}

// TestEnsurePermissionFailsClosed verifies missing permissions never reach database work.
func TestEnsurePermissionFailsClosed(t *testing.T) {
	svc := &serviceImpl{authzSvc: projectTestAuthz{allowed: false}}
	if err := svc.ensurePermission(context.Background(), permissionView); !bizerr.Is(err, CodeForbidden) {
		t.Fatalf("expected forbidden error, got %v", err)
	}
	svc.authzSvc = projectTestAuthz{allowed: true}
	if err := svc.ensurePermission(context.Background(), permissionView); err != nil {
		t.Fatalf("expected permission success, got %v", err)
	}
}

// TestNormalizePage verifies stable pagination defaults and caps.
func TestNormalizePage(t *testing.T) {
	pageNum, pageSize := normalizePage(0, 0)
	if pageNum != defaultPageNum || pageSize != defaultPageSize {
		t.Fatalf("unexpected defaults page=%d size=%d", pageNum, pageSize)
	}
	pageNum, pageSize = normalizePage(2, 1000)
	if pageNum != 2 || pageSize != maxPageSize {
		t.Fatalf("unexpected capped page=%d size=%d", pageNum, pageSize)
	}
}
