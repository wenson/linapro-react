// Package project exposes TapCanvas project service operations through generated API contracts.
package project

import (
	"lina-plugin-linapro-tapcanvas-studio/backend/api/project/v1"
	projectsvc "lina-plugin-linapro-tapcanvas-studio/backend/internal/service/project"
)

// projectItem maps one service projection to the public response DTO.
func projectItem(item *projectsvc.Item) *v1.ProjectItem {
	if item == nil {
		return &v1.ProjectItem{}
	}
	return &v1.ProjectItem{
		Id:           item.ID,
		Name:         item.Name,
		Description:  item.Description,
		OwnerId:      item.OwnerID,
		ChapterCount: item.ChapterCount,
		LatestFlow:   nil,
		CreatedAt:    item.CreatedAt,
		UpdatedAt:    item.UpdatedAt,
	}
}
