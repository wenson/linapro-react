// chapter_v1_list.go handles bounded project chapter listing.

package chapter

import (
	"context"

	"lina-plugin-linapro-tapcanvas-studio/backend/api/chapter/v1"
)

// List returns the ordered chapters of one visible project.
func (c *ControllerV1) List(ctx context.Context, req *v1.ListReq) (res *v1.ListRes, err error) {
	items, err := c.chapterSvc.List(ctx, req.ProjectId)
	if err != nil {
		return nil, err
	}
	return &v1.ListRes{ProjectId: req.ProjectId, List: chapterItems(items)}, nil
}
