// Package chapter exposes TapCanvas chapter operations through generated API contracts.
package chapter

import (
	"lina-plugin-linapro-tapcanvas-studio/backend/api/chapter/v1"
	chaptersvc "lina-plugin-linapro-tapcanvas-studio/backend/internal/service/chapter"
)

// chapterItem maps one service projection to the public response DTO.
func chapterItem(item *chaptersvc.Item) *v1.ChapterItem {
	if item == nil {
		return &v1.ChapterItem{}
	}
	return &v1.ChapterItem{
		Id:           item.ID,
		ProjectId:    item.ProjectID,
		Index:        item.Index,
		Title:        item.Title,
		Summary:      item.Summary,
		Status:       item.Status,
		SortOrder:    item.SortOrder,
		OwnerId:      item.OwnerID,
		LastWorkedAt: item.LastWorkedAt,
		CreatedAt:    item.CreatedAt,
		UpdatedAt:    item.UpdatedAt,
	}
}

// chapterItems maps one ordered service slice to public DTOs.
func chapterItems(items []*chaptersvc.Item) []*v1.ChapterItem {
	result := make([]*v1.ChapterItem, 0, len(items))
	for _, item := range items {
		result = append(result, chapterItem(item))
	}
	return result
}
