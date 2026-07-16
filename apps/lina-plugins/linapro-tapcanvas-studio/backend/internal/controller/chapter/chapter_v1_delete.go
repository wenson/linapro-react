// chapter_v1_delete.go handles chapter soft deletion.

package chapter

import (
	"context"

	"lina-plugin-linapro-tapcanvas-studio/backend/api/chapter/v1"
)

// Delete soft-deletes one visible chapter.
func (c *ControllerV1) Delete(ctx context.Context, req *v1.DeleteReq) (res *v1.DeleteRes, err error) {
	if err = c.chapterSvc.Delete(ctx, req.ChapterId); err != nil {
		return nil, err
	}
	return &v1.DeleteRes{Id: req.ChapterId}, nil
}
