// project_v1_list.go handles bounded TapCanvas project listing.

package project

import (
	"context"

	"lina-plugin-linapro-tapcanvas-studio/backend/api/project/v1"
	projectsvc "lina-plugin-linapro-tapcanvas-studio/backend/internal/service/project"
)

// List returns one database-filtered visible project page.
func (c *ControllerV1) List(ctx context.Context, req *v1.ListReq) (res *v1.ListRes, err error) {
	output, err := c.projectSvc.List(ctx, projectsvc.ListInput{PageNum: req.PageNum, PageSize: req.PageSize, Keyword: req.Keyword})
	if err != nil {
		return nil, err
	}
	list := make([]*v1.ProjectItem, 0, len(output.List))
	for _, item := range output.List {
		list = append(list, projectItem(item))
	}
	return &v1.ListRes{List: list, Total: output.Total, PageNum: output.PageNum, PageSize: output.PageSize}, nil
}
