// project_v1_create.go handles TapCanvas project creation.

package project

import (
	"context"

	"lina-plugin-linapro-tapcanvas-studio/backend/api/project/v1"
	projectsvc "lina-plugin-linapro-tapcanvas-studio/backend/internal/service/project"
)

// Create creates one current-user-owned project.
func (c *ControllerV1) Create(ctx context.Context, req *v1.CreateReq) (res *v1.CreateRes, err error) {
	item, err := c.projectSvc.Create(ctx, projectsvc.CreateInput{Name: req.Name, Description: req.Description})
	if err != nil {
		return nil, err
	}
	result := v1.CreateRes(*projectItem(item))
	return &result, nil
}
