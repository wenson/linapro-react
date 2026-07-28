// project_get.go defines the TapCanvas project detail contract.

package v1

import "github.com/gogf/gf/v2/frame/g"

// GetReq loads one project only when it is visible in the current Tenant and data scope.
type GetReq struct {
	g.Meta    `path:"/projects/{projectId}" method:"get" tags:"TapCanvas Projects" summary:"Get a TapCanvas project" dc:"Get one visible project with its bounded chapter count projection without revealing whether an out-of-scope project exists." permission:"tapcanvas:project:view"`
	ProjectId string `json:"projectId" v:"required|length:1,36" dc:"Project ID" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06215"`
}

// GetRes returns one visible project projection.
type GetRes ProjectItem
