// Package project implements tenant-scoped TapCanvas project operations.
package project

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"

	"lina-core/pkg/plugin/capability/authcap/authz"
	"lina-core/pkg/plugin/capability/bizctxcap"
	"lina-core/pkg/plugin/capability/tenantcap"
)

// Service defines project operations and the visibility contract consumed by chapters.
type Service interface {
	// List returns a database-filtered project page and bounded aggregate projections.
	List(ctx context.Context, in ListInput) (*ListOutput, error)
	// Get returns one visible project or an opaque not-found error.
	Get(ctx context.Context, projectID string) (*Item, error)
	// Create creates one current-user-owned project inside the current Tenant.
	Create(ctx context.Context, in CreateInput) (*Item, error)
	// Update changes mutable fields after target visibility validation.
	Update(ctx context.Context, in UpdateInput) (*Item, error)
	// Delete soft-deletes one visible project.
	Delete(ctx context.Context, projectID string) error
	// EnsureVisible returns a stable access projection without exposing generated models.
	EnsureVisible(ctx context.Context, projectID string) (*Access, error)
	// EnsureChapterVisible validates one child chapter through its ancestor project in database scope.
	EnsureChapterVisible(ctx context.Context, chapterID string) (*Access, error)
}

// Interface compliance assertion for the default project service.
var _ Service = (*serviceImpl)(nil)

// serviceImpl stores explicitly injected host and database dependencies.
type serviceImpl struct {
	bizCtxSvc bizctxcap.Service
	tenantSvc tenantcap.Service
	authzSvc  authz.Service
	db        gdb.DB
}

// New creates one project service from runtime-owned shared dependencies.
func New(
	bizCtxSvc bizctxcap.Service,
	tenantSvc tenantcap.Service,
	authzSvc authz.Service,
	db gdb.DB,
) Service {
	return &serviceImpl{
		bizCtxSvc: bizCtxSvc,
		tenantSvc: tenantSvc,
		authzSvc:  authzSvc,
		db:        db,
	}
}

// Access is the stable visible-project projection consumed by child resources.
type Access struct {
	ProjectID string
	TenantID  int64
	OwnerID   int64
}

// ListInput contains bounded project list filters.
type ListInput struct {
	PageNum  int
	PageSize int
	Keyword  string
}

// ListOutput is one visible project page.
type ListOutput struct {
	List     []*Item
	Total    int
	PageNum  int
	PageSize int
}

// Item is the internal API-safe project projection.
type Item struct {
	ID           string
	Name         string
	Description  string
	OwnerID      int64
	ChapterCount int
	CreatedAt    *int64
	UpdatedAt    *int64
}

// CreateInput contains client-controlled project creation fields.
type CreateInput struct {
	Name        string
	Description string
}

// UpdateInput contains optional client-controlled project changes.
type UpdateInput struct {
	ProjectID   string
	Name        *string
	Description *string
}
