// chapter.go defines response projections and status values shared by chapter APIs.

package v1

// ChapterItem is one visible project chapter projection.
type ChapterItem struct {
	Id           string `json:"id" dc:"Chapter ID" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06217"`
	ProjectId    string `json:"projectId" dc:"Owning project ID" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06215"`
	Index        int    `json:"index" dc:"Stable one-based chapter index inside the project" eg:"1"`
	Title        string `json:"title" dc:"Chapter title" eg:"Opening"`
	Summary      string `json:"summary" dc:"Chapter summary" eg:"The protagonists meet for the first time."`
	Status       string `json:"status" dc:"Chapter workflow status: draft, planning, producing, review, approved, locked, or archived" eg:"draft"`
	SortOrder    int    `json:"sortOrder" dc:"Project-local display order" eg:"1"`
	OwnerId      int64  `json:"ownerId" dc:"Creating LinaPro user ID retained for audit projection" eg:"1"`
	LastWorkedAt *int64 `json:"lastWorkedAt" dc:"Last work time as Unix timestamp in milliseconds; null when never opened" eg:"null"`
	CreatedAt    *int64 `json:"createdAt" dc:"Creation time as Unix timestamp in milliseconds" eg:"1784170800000"`
	UpdatedAt    *int64 `json:"updatedAt" dc:"Last update time as Unix timestamp in milliseconds" eg:"1784171100000"`
}
