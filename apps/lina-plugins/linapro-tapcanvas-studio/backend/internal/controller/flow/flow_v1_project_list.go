package flow

import (
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	"lina-plugin-linapro-tapcanvas-studio/backend/api/flow/v1"
)

func (c *ControllerV1) ProjectList(ctx context.Context, req *v1.ProjectListReq) (res *v1.ProjectListRes, err error) {
	return nil, gerror.NewCode(gcode.CodeNotImplemented)
}
