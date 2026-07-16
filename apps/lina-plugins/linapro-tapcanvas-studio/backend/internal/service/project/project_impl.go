// project_impl.go implements project CRUD, paging, and chapter-count projection.

package project

import (
	"context"
	"strings"

	"github.com/gogf/gf/v2/util/guid"

	"lina-core/pkg/apitime"
	"lina-core/pkg/bizerr"
	"lina-plugin-linapro-tapcanvas-studio/backend/internal/dao"
	"lina-plugin-linapro-tapcanvas-studio/backend/internal/model/do"
	"lina-plugin-linapro-tapcanvas-studio/backend/internal/model/entity"
)

const (
	defaultPageNum  = 1
	defaultPageSize = 20
	maxPageSize     = 100
)

// chapterCountRow stores one grouped chapter-count projection.
type chapterCountRow struct {
	ProjectID    string `orm:"project_id"`
	ChapterCount int    `orm:"chapter_count"`
}

// List returns a bounded visible project page without per-row queries.
func (s *serviceImpl) List(ctx context.Context, in ListInput) (*ListOutput, error) {
	if err := s.ensurePermission(ctx, permissionView); err != nil {
		return nil, err
	}
	pageNum, pageSize := normalizePage(in.PageNum, in.PageSize)
	model, scope, empty, err := s.visibleModel(ctx)
	if err != nil {
		return nil, err
	}
	if empty {
		return &ListOutput{List: []*Item{}, PageNum: pageNum, PageSize: pageSize}, nil
	}
	cols := dao.Projects.Columns()
	if keyword := strings.TrimSpace(in.Keyword); keyword != "" {
		model = model.WhereLike(cols.Name, "%"+keyword+"%")
	}
	total, err := model.Count()
	if err != nil {
		return nil, bizerr.WrapCode(err, CodeQueryFailed)
	}
	rows := make([]*entity.Projects, 0)
	if err = model.OrderDesc(cols.UpdatedAt).OrderDesc(cols.Id).Page(pageNum, pageSize).Scan(&rows); err != nil {
		return nil, bizerr.WrapCode(err, CodeQueryFailed)
	}
	counts, err := s.chapterCounts(ctx, scope.TenantID, projectIDs(rows))
	if err != nil {
		return nil, err
	}
	items := make([]*Item, 0, len(rows))
	for _, row := range rows {
		items = append(items, projectItem(row, counts[row.Id]))
	}
	return &ListOutput{List: items, Total: total, PageNum: pageNum, PageSize: pageSize}, nil
}

// Get returns one visible project.
func (s *serviceImpl) Get(ctx context.Context, projectID string) (*Item, error) {
	if err := s.ensurePermission(ctx, permissionView); err != nil {
		return nil, err
	}
	row, access, err := s.visibleEntity(ctx, projectID)
	if err != nil {
		return nil, err
	}
	counts, err := s.chapterCounts(ctx, access.TenantID, []string{row.Id})
	if err != nil {
		return nil, err
	}
	return projectItem(row, counts[row.Id]), nil
}

// Create creates one current-user-owned project.
func (s *serviceImpl) Create(ctx context.Context, in CreateInput) (*Item, error) {
	if err := s.ensurePermission(ctx, permissionCreate); err != nil {
		return nil, err
	}
	scope, err := s.currentScope(ctx)
	if err != nil {
		return nil, err
	}
	name := strings.TrimSpace(in.Name)
	if name == "" || len([]rune(name)) > 200 || len([]rune(in.Description)) > 1000 {
		return nil, bizerr.NewCode(CodeInvalidInput)
	}
	projectID := guid.S()
	_, err = s.db.Model(dao.Projects.Table()).Safe().Ctx(ctx).Data(do.Projects{
		Id:          projectID,
		TenantId:    scope.TenantID,
		OwnerId:     scope.UserID,
		Name:        name,
		Description: strings.TrimSpace(in.Description),
	}).Insert()
	if err != nil {
		return nil, bizerr.WrapCode(err, CodeCreateFailed)
	}
	return s.getVisibleItemWithoutPermission(ctx, projectID)
}

// Update changes mutable fields after target visibility validation.
func (s *serviceImpl) Update(ctx context.Context, in UpdateInput) (*Item, error) {
	if err := s.ensurePermission(ctx, permissionUpdate); err != nil {
		return nil, err
	}
	row, _, err := s.visibleEntity(ctx, in.ProjectID)
	if err != nil {
		return nil, err
	}
	data := do.Projects{}
	changed := false
	if in.Name != nil {
		name := strings.TrimSpace(*in.Name)
		if name == "" || len([]rune(name)) > 200 {
			return nil, bizerr.NewCode(CodeInvalidInput)
		}
		data.Name = name
		changed = true
	}
	if in.Description != nil {
		if len([]rune(*in.Description)) > 1000 {
			return nil, bizerr.NewCode(CodeInvalidInput)
		}
		data.Description = strings.TrimSpace(*in.Description)
		changed = true
	}
	if !changed {
		return nil, bizerr.NewCode(CodeInvalidInput)
	}
	cols := dao.Projects.Columns()
	_, err = s.db.Model(dao.Projects.Table()).Safe().Ctx(ctx).
		Where(cols.TenantId, row.TenantId).
		Where(do.Projects{Id: row.Id}).
		Data(data).
		Update()
	if err != nil {
		return nil, bizerr.WrapCode(err, CodeUpdateFailed)
	}
	return s.getVisibleItemWithoutPermission(ctx, row.Id)
}

// Delete soft-deletes one visible project.
func (s *serviceImpl) Delete(ctx context.Context, projectID string) error {
	if err := s.ensurePermission(ctx, permissionDelete); err != nil {
		return err
	}
	row, _, err := s.visibleEntity(ctx, projectID)
	if err != nil {
		return err
	}
	cols := dao.Projects.Columns()
	_, err = s.db.Model(dao.Projects.Table()).Safe().Ctx(ctx).
		Where(cols.TenantId, row.TenantId).
		Where(do.Projects{Id: row.Id}).
		Delete()
	if err != nil {
		return bizerr.WrapCode(err, CodeDeleteFailed)
	}
	return nil
}

// EnsureVisible returns a stable access projection for child-resource checks.
func (s *serviceImpl) EnsureVisible(ctx context.Context, projectID string) (*Access, error) {
	_, access, err := s.visibleEntity(ctx, projectID)
	return access, err
}

// EnsureChapterVisible validates a child through a scoped project query whose
// subquery also excludes soft-deleted chapters.
func (s *serviceImpl) EnsureChapterVisible(ctx context.Context, chapterID string) (*Access, error) {
	chapterID = strings.TrimSpace(chapterID)
	if chapterID == "" || len(chapterID) > 36 {
		return nil, bizerr.NewCode(CodeNotFound)
	}
	model, scope, empty, err := s.visibleModel(ctx)
	if err != nil {
		return nil, err
	}
	if empty {
		return nil, bizerr.NewCode(CodeNotFound)
	}
	chapterCols := dao.Chapters.Columns()
	projectCols := dao.Projects.Columns()
	projectIDs := s.db.Model(dao.Chapters.Table()).Safe().Ctx(ctx).
		Fields(chapterCols.ProjectId).
		Where(chapterCols.TenantId, scope.TenantID).
		Where(do.Chapters{Id: chapterID})
	var row *entity.Projects
	if err = model.WhereIn(projectCols.Id, projectIDs).Scan(&row); err != nil {
		return nil, bizerr.WrapCode(err, CodeQueryFailed)
	}
	if row == nil {
		return nil, bizerr.NewCode(CodeNotFound)
	}
	return &Access{ProjectID: row.Id, TenantID: row.TenantId, OwnerID: row.OwnerId}, nil
}

// visibleEntity loads one project through the shared visibility predicate.
func (s *serviceImpl) visibleEntity(ctx context.Context, projectID string) (*entity.Projects, *Access, error) {
	projectID = strings.TrimSpace(projectID)
	if projectID == "" || len(projectID) > 36 {
		return nil, nil, bizerr.NewCode(CodeNotFound)
	}
	model, _, empty, err := s.visibleModel(ctx)
	if err != nil {
		return nil, nil, err
	}
	if empty {
		return nil, nil, bizerr.NewCode(CodeNotFound)
	}
	var row *entity.Projects
	if err = model.Where(do.Projects{Id: projectID}).Scan(&row); err != nil {
		return nil, nil, bizerr.WrapCode(err, CodeQueryFailed)
	}
	if row == nil {
		return nil, nil, bizerr.NewCode(CodeNotFound)
	}
	return row, &Access{ProjectID: row.Id, TenantID: row.TenantId, OwnerID: row.OwnerId}, nil
}

// getVisibleItemWithoutPermission reloads one item after a permission-checked mutation.
func (s *serviceImpl) getVisibleItemWithoutPermission(ctx context.Context, projectID string) (*Item, error) {
	row, access, err := s.visibleEntity(ctx, projectID)
	if err != nil {
		return nil, err
	}
	counts, err := s.chapterCounts(ctx, access.TenantID, []string{projectID})
	if err != nil {
		return nil, err
	}
	return projectItem(row, counts[projectID]), nil
}

// chapterCounts returns one grouped query projection for all project IDs.
func (s *serviceImpl) chapterCounts(ctx context.Context, tenantID int64, projectIDs []string) (map[string]int, error) {
	counts := make(map[string]int, len(projectIDs))
	if len(projectIDs) == 0 {
		return counts, nil
	}
	cols := dao.Chapters.Columns()
	rows := make([]chapterCountRow, 0, len(projectIDs))
	err := s.db.Model(dao.Chapters.Table()).Safe().Ctx(ctx).
		Fields(cols.ProjectId, "COUNT(1) AS chapter_count").
		Where(cols.TenantId, tenantID).
		WhereIn(cols.ProjectId, projectIDs).
		Group(cols.ProjectId).
		Scan(&rows)
	if err != nil {
		return nil, bizerr.WrapCode(err, CodeQueryFailed)
	}
	for _, row := range rows {
		counts[row.ProjectID] = row.ChapterCount
	}
	return counts, nil
}

// projectIDs extracts page project IDs for one batch aggregate query.
func projectIDs(rows []*entity.Projects) []string {
	ids := make([]string, 0, len(rows))
	for _, row := range rows {
		if row != nil {
			ids = append(ids, row.Id)
		}
	}
	return ids
}

// projectItem maps a generated entity to the API-safe service projection.
func projectItem(row *entity.Projects, chapterCount int) *Item {
	if row == nil {
		return &Item{}
	}
	return &Item{
		ID:           row.Id,
		Name:         row.Name,
		Description:  row.Description,
		OwnerID:      row.OwnerId,
		ChapterCount: chapterCount,
		CreatedAt:    apitime.Milli(row.CreatedAt),
		UpdatedAt:    apitime.Milli(row.UpdatedAt),
	}
}

// normalizePage applies stable list defaults and the public maximum.
func normalizePage(pageNum int, pageSize int) (int, int) {
	if pageNum <= 0 {
		pageNum = defaultPageNum
	}
	if pageSize <= 0 {
		pageSize = defaultPageSize
	}
	if pageSize > maxPageSize {
		pageSize = maxPageSize
	}
	return pageNum, pageSize
}
