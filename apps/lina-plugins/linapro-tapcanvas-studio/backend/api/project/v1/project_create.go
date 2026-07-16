// project_create.go defines the TapCanvas project creation contract.

package v1

import "github.com/gogf/gf/v2/frame/g"

// CreateReq creates one project owned by the current LinaPro user and Tenant.
type CreateReq struct {
	g.Meta      `path:"/projects" method:"post" tags:"TapCanvas Projects" summary:"Create a TapCanvas project" dc:"Create a project whose tenant and owner are derived only from the governed LinaPro request context." permission:"tapcanvas:project:create"`
	Name        string `json:"name" v:"required|length:1,200" dc:"Project name" eg:"Summer Campaign"`
	Description string `json:"description" v:"length:0,1000" dc:"Optional project description" eg:"Short-form campaign production"`
}

// CreateRes returns the created project projection.
type CreateRes ProjectItem
