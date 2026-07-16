// chapter_v1_get.go handles one visible chapter detail.

package chapter

import (
	"context"

	"lina-plugin-linapro-tapcanvas-studio/backend/api/chapter/v1"
)

// Get returns one chapter whose ancestor project remains visible.
func (c *ControllerV1) Get(ctx context.Context, req *v1.GetReq) (res *v1.GetRes, err error) {
	item, err := c.chapterSvc.Get(ctx, req.ChapterId)
	if err != nil {
		return nil, err
	}
	result := v1.GetRes(*chapterItem(item))
	return &result, nil
}
