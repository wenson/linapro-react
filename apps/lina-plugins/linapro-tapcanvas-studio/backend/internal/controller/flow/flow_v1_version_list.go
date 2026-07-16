package flow

import (
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	"lina-plugin-linapro-tapcanvas-studio/backend/api/flow/v1"
)

func (c *ControllerV1) VersionList(ctx context.Context, req *v1.VersionListReq) (res *v1.VersionListRes, err error) {
	return nil, gerror.NewCode(gcode.CodeNotImplemented)
}
