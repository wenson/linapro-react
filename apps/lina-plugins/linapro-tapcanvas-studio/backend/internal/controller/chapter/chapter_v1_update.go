// chapter_v1_update.go handles chapter field and status updates.

package chapter

import (
	"context"

	"lina-plugin-linapro-tapcanvas-studio/backend/api/chapter/v1"
	chaptersvc "lina-plugin-linapro-tapcanvas-studio/backend/internal/service/chapter"
)

// Update changes mutable fields of one visible chapter.
func (c *ControllerV1) Update(ctx context.Context, req *v1.UpdateReq) (res *v1.UpdateRes, err error) {
	item, err := c.chapterSvc.Update(ctx, chaptersvc.UpdateInput{
		ChapterID: req.ChapterId,
		Title:     req.Title,
		Summary:   req.Summary,
		Status:    req.Status,
		SortOrder: req.SortOrder,
	})
	if err != nil {
		return nil, err
	}
	result := v1.UpdateRes(*chapterItem(item))
	return &result, nil
}
