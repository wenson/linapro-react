// chapter_v1_create.go handles project chapter creation.

package chapter

import (
	"context"

	"lina-plugin-linapro-tapcanvas-studio/backend/api/chapter/v1"
	chaptersvc "lina-plugin-linapro-tapcanvas-studio/backend/internal/service/chapter"
)

// Create creates one chapter under a visible project.
func (c *ControllerV1) Create(ctx context.Context, req *v1.CreateReq) (res *v1.CreateRes, err error) {
	item, err := c.chapterSvc.Create(ctx, chaptersvc.CreateInput{ProjectID: req.ProjectId, Title: req.Title, Summary: req.Summary})
	if err != nil {
		return nil, err
	}
	result := v1.CreateRes(*chapterItem(item))
	return &result, nil
}
