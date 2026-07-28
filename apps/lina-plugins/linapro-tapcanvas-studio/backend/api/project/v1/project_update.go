// project_update.go defines the TapCanvas project update contract.

package v1

import "github.com/gogf/gf/v2/frame/g"

// UpdateReq updates mutable fields of one visible project.
type UpdateReq struct {
	g.Meta      `path:"/projects/{projectId}" method:"put" tags:"TapCanvas Projects" summary:"Update a TapCanvas project" dc:"Update the name or description of a project after checking target visibility in the current Tenant and role data scope." permission:"tapcanvas:project:update"`
	ProjectId   string  `json:"projectId" v:"required|length:1,36" dc:"Project ID" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06215"`
	Name        *string `json:"name" v:"length:1,200" dc:"Optional replacement project name; omit to keep the current name" eg:"Autumn Campaign"`
	Description *string `json:"description" v:"length:0,1000" dc:"Optional replacement project description; omit to keep the current description" eg:"Updated campaign production"`
}

// UpdateRes returns the updated project projection.
type UpdateRes ProjectItem
