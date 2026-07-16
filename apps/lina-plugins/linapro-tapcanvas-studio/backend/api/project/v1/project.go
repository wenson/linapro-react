// project.go defines response projections shared by TapCanvas project APIs.

package v1

// ProjectItem is one visible tenant project projection.
type ProjectItem struct {
	Id           string              `json:"id" dc:"Project ID" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06215"`
	Name         string              `json:"name" dc:"Project name" eg:"Summer Campaign"`
	Description  string              `json:"description" dc:"Project description" eg:"Short-form campaign production"`
	OwnerId      int64               `json:"ownerId" dc:"Owning LinaPro user ID" eg:"1"`
	ChapterCount int                 `json:"chapterCount" dc:"Number of visible non-deleted chapters in this project" eg:"3"`
	LatestFlow   *ProjectFlowSummary `json:"latestFlow" dc:"Most recently updated visible Flow summary; null until the project owns a Flow" eg:"null"`
	CreatedAt    *int64              `json:"createdAt" dc:"Creation time as Unix timestamp in milliseconds" eg:"1784170800000"`
	UpdatedAt    *int64              `json:"updatedAt" dc:"Last update time as Unix timestamp in milliseconds" eg:"1784171100000"`
}

// ProjectFlowSummary is the bounded recent Flow projection returned with projects.
type ProjectFlowSummary struct {
	Id        string `json:"id" dc:"Flow ID" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06216"`
	Name      string `json:"name" dc:"Flow name" eg:"Main Storyboard"`
	UpdatedAt *int64 `json:"updatedAt" dc:"Flow update time as Unix timestamp in milliseconds" eg:"1784171100000"`
}
