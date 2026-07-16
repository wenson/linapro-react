// project_v1_delete.go handles TapCanvas project soft deletion.

package project

import (
	"context"

	"lina-plugin-linapro-tapcanvas-studio/backend/api/project/v1"
)

// Delete soft-deletes one visible project.
func (c *ControllerV1) Delete(ctx context.Context, req *v1.DeleteReq) (res *v1.DeleteRes, err error) {
	if err = c.projectSvc.Delete(ctx, req.ProjectId); err != nil {
		return nil, err
	}
	return &v1.DeleteRes{Id: req.ProjectId}, nil
}
