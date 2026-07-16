// project_delete.go defines the TapCanvas project deletion contract.

package v1

import "github.com/gogf/gf/v2/frame/g"

// DeleteReq soft-deletes one visible project.
type DeleteReq struct {
	g.Meta    `path:"/projects/{projectId}" method:"delete" tags:"TapCanvas Projects" summary:"Delete a TapCanvas project" dc:"Soft-delete one visible project so its chapters also become unreachable through ancestor visibility checks." permission:"tapcanvas:project:delete"`
	ProjectId string `json:"projectId" v:"required|length:1,36" dc:"Project ID" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06215"`
}

// DeleteRes identifies the deleted project.
type DeleteRes struct {
	Id string `json:"id" dc:"Deleted project ID" eg:"019c4b38-4e49-7ce2-b4f6-d2bb41c06215"`
}
