// project_v1_update.go handles TapCanvas project updates.

package project

import (
	"context"

	"lina-plugin-linapro-tapcanvas-studio/backend/api/project/v1"
	projectsvc "lina-plugin-linapro-tapcanvas-studio/backend/internal/service/project"
)

// Update changes mutable fields of one visible project.
func (c *ControllerV1) Update(ctx context.Context, req *v1.UpdateReq) (res *v1.UpdateRes, err error) {
	item, err := c.projectSvc.Update(ctx, projectsvc.UpdateInput{ProjectID: req.ProjectId, Name: req.Name, Description: req.Description})
	if err != nil {
		return nil, err
	}
	result := v1.UpdateRes(*projectItem(item))
	return &result, nil
}
