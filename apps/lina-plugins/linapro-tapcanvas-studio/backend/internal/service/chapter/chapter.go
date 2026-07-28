// Package chapter implements TapCanvas chapter operations constrained by visible projects.
package chapter

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"

	"lina-core/pkg/plugin/capability/authcap/authz"
	"lina-core/pkg/plugin/capability/bizctxcap"
	"lina-core/pkg/plugin/capability/tenantcap"
	projectsvc "lina-plugin-linapro-tapcanvas-studio/backend/internal/service/project"
)

// Service defines chapter CRUD and atomic ordering behavior.
type Service interface {
	// List returns the bounded ordered chapters of one visible project.
	List(ctx context.Context, projectID string) ([]*Item, error)
	// Get returns one chapter only when its ancestor project is visible.
	Get(ctx context.Context, chapterID string) (*Item, error)
	// Create creates one chapter under a visible project.
	Create(ctx context.Context, in CreateInput) (*Item, error)
	// Update changes mutable chapter fields after ancestor visibility validation.
	Update(ctx context.Context, in UpdateInput) (*Item, error)
	// Delete soft-deletes one visible chapter.
	Delete(ctx context.Context, chapterID string) error
	// Reorder atomically replaces the complete visible chapter order.
	Reorder(ctx context.Context, projectID string, chapterIDs []string) ([]*Item, error)
}

// Interface compliance assertion for the default chapter service.
var _ Service = (*serviceImpl)(nil)

// serviceImpl stores explicitly injected context, authorization, database, and parent dependencies.
type serviceImpl struct {
	bizCtxSvc bizctxcap.Service
	tenantSvc tenantcap.Service
	authzSvc  authz.Service
	db        gdb.DB
	projects  projectsvc.Service
}

// New creates one chapter service from runtime-owned shared dependencies.
func New(
	bizCtxSvc bizctxcap.Service,
	tenantSvc tenantcap.Service,
	authzSvc authz.Service,
	db gdb.DB,
	projects projectsvc.Service,
) Service {
	return &serviceImpl{
		bizCtxSvc: bizCtxSvc,
		tenantSvc: tenantSvc,
		authzSvc:  authzSvc,
		db:        db,
		projects:  projects,
	}
}

// Item is the internal API-safe chapter projection.
type Item struct {
	ID           string
	ProjectID    string
	Index        int
	Title        string
	Summary      string
	Status       string
	SortOrder    int
	OwnerID      int64
	LastWorkedAt *int64
	CreatedAt    *int64
	UpdatedAt    *int64
}

// CreateInput contains client-controlled chapter creation fields.
type CreateInput struct {
	ProjectID string
	Title     string
	Summary   string
}

// UpdateInput contains optional client-controlled chapter changes.
type UpdateInput struct {
	ChapterID string
	Title     *string
	Summary   *string
	Status    *string
	SortOrder *int
}
