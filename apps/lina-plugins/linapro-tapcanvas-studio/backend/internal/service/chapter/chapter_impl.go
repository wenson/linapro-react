// chapter_impl.go implements ancestor-scoped chapter CRUD and atomic ordering.

package chapter

import (
	"context"
	"regexp"
	"strconv"
	"strings"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/util/guid"

	"lina-core/pkg/apitime"
	"lina-core/pkg/bizerr"
	"lina-core/pkg/plugin/capability/authcap/authz"
	"lina-plugin-linapro-tapcanvas-studio/backend/internal/dao"
	"lina-plugin-linapro-tapcanvas-studio/backend/internal/model/do"
	"lina-plugin-linapro-tapcanvas-studio/backend/internal/model/entity"
	projectsvc "lina-plugin-linapro-tapcanvas-studio/backend/internal/service/project"
)

const (
	maxChaptersPerProject = 200
	permissionView        = "tapcanvas:project:view"
	permissionUpdate      = "tapcanvas:project:update"
)

// ChapterStatus identifies one dictionary-governed chapter workflow status.
type ChapterStatus string

const (
	ChapterStatusDraft     ChapterStatus = "draft"
	ChapterStatusPlanning  ChapterStatus = "planning"
	ChapterStatusProducing ChapterStatus = "producing"
	ChapterStatusReview    ChapterStatus = "review"
	ChapterStatusApproved  ChapterStatus = "approved"
	ChapterStatusLocked    ChapterStatus = "locked"
	ChapterStatusArchived  ChapterStatus = "archived"
)

var chapterIDPattern = regexp.MustCompile(`^[A-Za-z0-9-]{1,36}$`)

// chapterAggregateRow stores the next stable index and display order.
type chapterAggregateRow struct {
	MaxIndex int `orm:"max_index"`
	MaxSort  int `orm:"max_sort"`
}

// List returns the bounded ordered chapters of one visible project.
func (s *serviceImpl) List(ctx context.Context, projectID string) ([]*Item, error) {
	if err := s.ensurePermission(ctx, permissionView); err != nil {
		return nil, err
	}
	access, err := s.ensureProject(ctx, projectID)
	if err != nil {
		return nil, err
	}
	return s.listVisible(ctx, access)
}

// Get returns one chapter only when its ancestor project is visible.
func (s *serviceImpl) Get(ctx context.Context, chapterID string) (*Item, error) {
	if err := s.ensurePermission(ctx, permissionView); err != nil {
		return nil, err
	}
	row, _, err := s.visibleEntity(ctx, chapterID)
	if err != nil {
		return nil, err
	}
	return chapterItem(row), nil
}

// Create creates one chapter under a visible project.
func (s *serviceImpl) Create(ctx context.Context, in CreateInput) (*Item, error) {
	if err := s.ensurePermission(ctx, permissionUpdate); err != nil {
		return nil, err
	}
	access, err := s.ensureProject(ctx, in.ProjectID)
	if err != nil {
		return nil, err
	}
	userID, err := s.currentUser(ctx, access.TenantID)
	if err != nil {
		return nil, err
	}
	title := strings.TrimSpace(in.Title)
	if title == "" || len([]rune(title)) > 200 || len([]rune(in.Summary)) > 5000 {
		return nil, bizerr.NewCode(CodeInvalidInput)
	}
	chapterID := guid.S()
	err = dao.Chapters.Transaction(ctx, func(ctx context.Context, _ gdb.TX) error {
		cols := dao.Chapters.Columns()
		var aggregate chapterAggregateRow
		queryErr := s.db.Model(dao.Chapters.Table()).Safe().Ctx(ctx).
			Fields("COALESCE(MAX("+cols.ChapterIndex+"), 0) AS max_index", "COALESCE(MAX("+cols.SortOrder+"), 0) AS max_sort").
			Where(cols.TenantId, access.TenantID).
			Where(cols.ProjectId, access.ProjectID).
			Scan(&aggregate)
		if queryErr != nil {
			return bizerr.WrapCode(queryErr, CodeQueryFailed)
		}
		if aggregate.MaxIndex >= maxChaptersPerProject {
			return bizerr.NewCode(CodeInvalidInput)
		}
		_, insertErr := s.db.Model(dao.Chapters.Table()).Safe().Ctx(ctx).Data(do.Chapters{
			Id:           chapterID,
			TenantId:     access.TenantID,
			ProjectId:    access.ProjectID,
			OwnerId:      userID,
			ChapterIndex: aggregate.MaxIndex + 1,
			Title:        title,
			Summary:      strings.TrimSpace(in.Summary),
			Status:       ChapterStatusDraft,
			SortOrder:    aggregate.MaxSort + 1,
		}).Insert()
		if insertErr != nil {
			return bizerr.WrapCode(insertErr, CodeCreateFailed)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	row, _, err := s.visibleEntity(ctx, chapterID)
	if err != nil {
		return nil, err
	}
	return chapterItem(row), nil
}

// Update changes mutable chapter fields after ancestor visibility validation.
func (s *serviceImpl) Update(ctx context.Context, in UpdateInput) (*Item, error) {
	if err := s.ensurePermission(ctx, permissionUpdate); err != nil {
		return nil, err
	}
	row, access, err := s.visibleEntity(ctx, in.ChapterID)
	if err != nil {
		return nil, err
	}
	data := do.Chapters{}
	changed := false
	if in.Title != nil {
		title := strings.TrimSpace(*in.Title)
		if title == "" || len([]rune(title)) > 200 {
			return nil, bizerr.NewCode(CodeInvalidInput)
		}
		data.Title = title
		changed = true
	}
	if in.Summary != nil {
		if len([]rune(*in.Summary)) > 5000 {
			return nil, bizerr.NewCode(CodeInvalidInput)
		}
		data.Summary = strings.TrimSpace(*in.Summary)
		changed = true
	}
	if in.Status != nil {
		status := ChapterStatus(strings.TrimSpace(*in.Status))
		if !validStatus(status) {
			return nil, bizerr.NewCode(CodeInvalidStatus)
		}
		data.Status = status
		changed = true
	}
	if in.SortOrder != nil {
		if *in.SortOrder <= 0 || *in.SortOrder > maxChaptersPerProject {
			return nil, bizerr.NewCode(CodeInvalidInput)
		}
		data.SortOrder = *in.SortOrder
		changed = true
	}
	if !changed {
		return nil, bizerr.NewCode(CodeInvalidInput)
	}
	cols := dao.Chapters.Columns()
	_, err = s.db.Model(dao.Chapters.Table()).Safe().Ctx(ctx).
		Where(cols.TenantId, access.TenantID).
		Where(cols.ProjectId, access.ProjectID).
		Where(do.Chapters{Id: row.Id}).
		Data(data).
		Update()
	if err != nil {
		return nil, bizerr.WrapCode(err, CodeUpdateFailed)
	}
	updated, _, err := s.visibleEntity(ctx, row.Id)
	if err != nil {
		return nil, err
	}
	return chapterItem(updated), nil
}

// Delete soft-deletes one visible chapter.
func (s *serviceImpl) Delete(ctx context.Context, chapterID string) error {
	if err := s.ensurePermission(ctx, permissionUpdate); err != nil {
		return err
	}
	row, access, err := s.visibleEntity(ctx, chapterID)
	if err != nil {
		return err
	}
	cols := dao.Chapters.Columns()
	_, err = s.db.Model(dao.Chapters.Table()).Safe().Ctx(ctx).
		Where(cols.TenantId, access.TenantID).
		Where(cols.ProjectId, access.ProjectID).
		Where(do.Chapters{Id: row.Id}).
		Delete()
	if err != nil {
		return bizerr.WrapCode(err, CodeDeleteFailed)
	}
	return nil
}

// Reorder atomically replaces the complete visible chapter order with one update query.
func (s *serviceImpl) Reorder(ctx context.Context, projectID string, chapterIDs []string) ([]*Item, error) {
	if err := s.ensurePermission(ctx, permissionUpdate); err != nil {
		return nil, err
	}
	access, err := s.ensureProject(ctx, projectID)
	if err != nil {
		return nil, err
	}
	normalized, err := normalizeChapterIDs(chapterIDs)
	if err != nil {
		return nil, err
	}
	current, err := s.listVisible(ctx, access)
	if err != nil {
		return nil, err
	}
	if !sameChapterSet(current, normalized) {
		return nil, bizerr.NewCode(CodeReorderMismatch)
	}
	caseExpression := buildSortCase(normalized)
	cols := dao.Chapters.Columns()
	err = dao.Chapters.Transaction(ctx, func(ctx context.Context, _ gdb.TX) error {
		_, updateErr := s.db.Model(dao.Chapters.Table()).Safe().Ctx(ctx).
			Where(cols.TenantId, access.TenantID).
			Where(cols.ProjectId, access.ProjectID).
			WhereIn(cols.Id, normalized).
			Data(do.Chapters{SortOrder: gdb.Raw(caseExpression)}).
			Update()
		if updateErr != nil {
			return bizerr.WrapCode(updateErr, CodeReorderFailed)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return s.listVisible(ctx, access)
}

// ensurePermission validates service-level callers in addition to route middleware.
func (s *serviceImpl) ensurePermission(ctx context.Context, permission string) error {
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

// ensureProject validates parent visibility and dependency availability.
func (s *serviceImpl) ensureProject(ctx context.Context, projectID string) (*projectsvc.Access, error) {
	if s == nil || s.projects == nil || s.db == nil {
		return nil, bizerr.NewCode(CodeContextRequired)
	}
	access, err := s.projects.EnsureVisible(ctx, projectID)
	if err != nil {
		if bizerr.Is(err, projectsvc.CodeNotFound) {
			return nil, bizerr.NewCode(CodeNotFound)
		}
		return nil, err
	}
	return access, nil
}

// currentUser resolves the server-owned chapter creator after Tenant consistency checks.
func (s *serviceImpl) currentUser(ctx context.Context, tenantID int64) (int64, error) {
	if s == nil || s.bizCtxSvc == nil || s.tenantSvc == nil || s.tenantSvc.Filter() == nil {
		return 0, bizerr.NewCode(CodeContextRequired)
	}
	current := s.bizCtxSvc.Current(ctx)
	tenantContext := s.tenantSvc.Filter().Context(ctx)
	if current.UserID <= 0 || int64(current.TenantID) != tenantID || int64(tenantContext.TenantID) != tenantID || current.PlatformBypass || tenantContext.PlatformBypass {
		return 0, bizerr.NewCode(CodeContextRequired)
	}
	return int64(current.UserID), nil
}

// visibleEntity validates chapter visibility through its ancestor before loading the row.
func (s *serviceImpl) visibleEntity(ctx context.Context, chapterID string) (*entity.Chapters, *projectsvc.Access, error) {
	chapterID = strings.TrimSpace(chapterID)
	if !chapterIDPattern.MatchString(chapterID) || s == nil || s.projects == nil || s.db == nil {
		return nil, nil, bizerr.NewCode(CodeNotFound)
	}
	access, err := s.projects.EnsureChapterVisible(ctx, chapterID)
	if err != nil {
		if bizerr.Is(err, projectsvc.CodeNotFound) {
			return nil, nil, bizerr.NewCode(CodeNotFound)
		}
		return nil, nil, err
	}
	cols := dao.Chapters.Columns()
	var row *entity.Chapters
	err = s.db.Model(dao.Chapters.Table()).Safe().Ctx(ctx).
		Where(cols.TenantId, access.TenantID).
		Where(cols.ProjectId, access.ProjectID).
		Where(do.Chapters{Id: chapterID}).
		Scan(&row)
	if err != nil {
		return nil, nil, bizerr.WrapCode(err, CodeQueryFailed)
	}
	if row == nil {
		return nil, nil, bizerr.NewCode(CodeNotFound)
	}
	return row, access, nil
}

// listVisible loads at most the frozen per-project chapter limit.
func (s *serviceImpl) listVisible(ctx context.Context, access *projectsvc.Access) ([]*Item, error) {
	if access == nil {
		return nil, bizerr.NewCode(CodeNotFound)
	}
	cols := dao.Chapters.Columns()
	rows := make([]*entity.Chapters, 0)
	err := s.db.Model(dao.Chapters.Table()).Safe().Ctx(ctx).
		Where(cols.TenantId, access.TenantID).
		Where(cols.ProjectId, access.ProjectID).
		OrderAsc(cols.SortOrder).
		OrderAsc(cols.Id).
		Limit(maxChaptersPerProject).
		Scan(&rows)
	if err != nil {
		return nil, bizerr.WrapCode(err, CodeQueryFailed)
	}
	items := make([]*Item, 0, len(rows))
	for _, row := range rows {
		items = append(items, chapterItem(row))
	}
	return items, nil
}

// chapterItem maps a generated entity to the API-safe service projection.
func chapterItem(row *entity.Chapters) *Item {
	if row == nil {
		return &Item{}
	}
	return &Item{
		ID:           row.Id,
		ProjectID:    row.ProjectId,
		Index:        row.ChapterIndex,
		Title:        row.Title,
		Summary:      row.Summary,
		Status:       row.Status,
		SortOrder:    row.SortOrder,
		OwnerID:      row.OwnerId,
		LastWorkedAt: apitime.Milli(row.LastWorkedAt),
		CreatedAt:    apitime.Milli(row.CreatedAt),
		UpdatedAt:    apitime.Milli(row.UpdatedAt),
	}
}

// validStatus checks one dictionary-governed chapter status.
func validStatus(status ChapterStatus) bool {
	switch status {
	case ChapterStatusDraft, ChapterStatusPlanning, ChapterStatusProducing, ChapterStatusReview, ChapterStatusApproved, ChapterStatusLocked, ChapterStatusArchived:
		return true
	default:
		return false
	}
}

// normalizeChapterIDs validates and deduplicates one complete reorder request.
func normalizeChapterIDs(chapterIDs []string) ([]string, error) {
	if len(chapterIDs) == 0 || len(chapterIDs) > maxChaptersPerProject {
		return nil, bizerr.NewCode(CodeReorderMismatch)
	}
	normalized := make([]string, 0, len(chapterIDs))
	seen := make(map[string]struct{}, len(chapterIDs))
	for _, value := range chapterIDs {
		chapterID := strings.TrimSpace(value)
		if !chapterIDPattern.MatchString(chapterID) {
			return nil, bizerr.NewCode(CodeReorderMismatch)
		}
		if _, exists := seen[chapterID]; exists {
			return nil, bizerr.NewCode(CodeReorderMismatch)
		}
		seen[chapterID] = struct{}{}
		normalized = append(normalized, chapterID)
	}
	return normalized, nil
}

// sameChapterSet verifies the reorder input is complete and contains no extras.
func sameChapterSet(current []*Item, chapterIDs []string) bool {
	if len(current) != len(chapterIDs) {
		return false
	}
	expected := make(map[string]struct{}, len(current))
	for _, item := range current {
		expected[item.ID] = struct{}{}
	}
	for _, chapterID := range chapterIDs {
		if _, exists := expected[chapterID]; !exists {
			return false
		}
	}
	return true
}

// buildSortCase creates one standard SQL CASE expression from validated IDs.
func buildSortCase(chapterIDs []string) string {
	var builder strings.Builder
	builder.WriteString("CASE id")
	for index, chapterID := range chapterIDs {
		builder.WriteString(" WHEN '")
		builder.WriteString(chapterID)
		builder.WriteString("' THEN ")
		builder.WriteString(strconv.Itoa(index + 1))
	}
	builder.WriteString(" ELSE sort_order END")
	return builder.String()
}
