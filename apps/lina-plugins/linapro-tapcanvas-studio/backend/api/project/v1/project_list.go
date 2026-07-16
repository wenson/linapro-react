// project_list.go defines the paged TapCanvas project list contract.

package v1

import "github.com/gogf/gf/v2/frame/g"

// ListReq queries visible projects inside the current LinaPro Tenant.
type ListReq struct {
	g.Meta   `path:"/projects" method:"get" tags:"TapCanvas Projects" summary:"List TapCanvas projects" dc:"List projects visible in the current LinaPro Tenant after applying role data scope, keyword filtering, sorting, and bounded pagination." permission:"tapcanvas:project:view"`
	PageNum  int    `json:"pageNum" d:"1" v:"min:1" dc:"Page number; defaults to 1" eg:"1"`
	PageSize int    `json:"pageSize" d:"20" v:"min:1|max:100" dc:"Items per page; defaults to 20 and cannot exceed 100" eg:"20"`
	Keyword  string `json:"keyword" v:"length:0,200" dc:"Optional fuzzy project-name keyword; empty returns all visible projects" eg:"Campaign"`
}

// ListRes returns one bounded visible project page.
type ListRes struct {
	List     []*ProjectItem `json:"list" dc:"Visible projects on the current page" eg:"[]"`
	Total    int            `json:"total" dc:"Total number of visible projects matching the filter" eg:"1"`
	PageNum  int            `json:"pageNum" dc:"Resolved page number" eg:"1"`
	PageSize int            `json:"pageSize" dc:"Resolved items per page" eg:"20"`
}
