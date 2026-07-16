// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package flow

import (
	"context"

	"lina-plugin-linapro-tapcanvas-studio/backend/api/flow/v1"
)

type IFlowV1 interface {
	Create(ctx context.Context, req *v1.CreateReq) (res *v1.CreateRes, err error)
	Delete(ctx context.Context, req *v1.DeleteReq) (res *v1.DeleteRes, err error)
	Get(ctx context.Context, req *v1.GetReq) (res *v1.GetRes, err error)
	List(ctx context.Context, req *v1.ListReq) (res *v1.ListRes, err error)
	Mutate(ctx context.Context, req *v1.MutateReq) (res *v1.MutateRes, err error)
	ProjectList(ctx context.Context, req *v1.ProjectListReq) (res *v1.ProjectListRes, err error)
	Update(ctx context.Context, req *v1.UpdateReq) (res *v1.UpdateRes, err error)
	VersionCreate(ctx context.Context, req *v1.VersionCreateReq) (res *v1.VersionCreateRes, err error)
	VersionGet(ctx context.Context, req *v1.VersionGetReq) (res *v1.VersionGetRes, err error)
	VersionList(ctx context.Context, req *v1.VersionListReq) (res *v1.VersionListRes, err error)
}
