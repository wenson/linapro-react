// project_v1_get.go handles one visible TapCanvas project detail.

package project

import (
	"context"

	"lina-plugin-linapro-tapcanvas-studio/backend/api/project/v1"
)

// Get returns one visible project with its bounded projections.
func (c *ControllerV1) Get(ctx context.Context, req *v1.GetReq) (res *v1.GetRes, err error) {
	item, err := c.projectSvc.Get(ctx, req.ProjectId)
	if err != nil {
		return nil, err
	}
	result := v1.GetRes(*projectItem(item))
	return &result, nil
}
