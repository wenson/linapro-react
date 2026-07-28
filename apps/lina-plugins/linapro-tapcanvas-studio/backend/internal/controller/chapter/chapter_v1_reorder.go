// chapter_v1_reorder.go handles atomic project chapter ordering.

package chapter

import (
	"context"

	"lina-plugin-linapro-tapcanvas-studio/backend/api/chapter/v1"
)

// Reorder replaces the complete visible chapter order.
func (c *ControllerV1) Reorder(ctx context.Context, req *v1.ReorderReq) (res *v1.ReorderRes, err error) {
	items, err := c.chapterSvc.Reorder(ctx, req.ProjectId, req.ChapterIds)
	if err != nil {
		return nil, err
	}
	return &v1.ReorderRes{ProjectId: req.ProjectId, List: chapterItems(items)}, nil
}
