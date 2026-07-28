// project_code.go defines stable TapCanvas project business errors.

package project

import (
	"github.com/gogf/gf/v2/errors/gcode"

	"lina-core/pkg/bizerr"
)

var (
	// CodeContextRequired reports missing authenticated Tenant context.
	CodeContextRequired = bizerr.MustDefine("TAPCANVAS_PROJECT_CONTEXT_REQUIRED", "Enter a LinaPro Tenant before using TapCanvas projects", gcode.CodeNotAuthorized)
	// CodeForbidden reports a missing project permission or denied data scope.
	CodeForbidden = bizerr.MustDefine("TAPCANVAS_PROJECT_FORBIDDEN", "You do not have access to this TapCanvas project operation", gcode.CodeNotAuthorized)
	// CodeNotFound hides missing and out-of-scope projects behind one response.
	CodeNotFound = bizerr.MustDefine("TAPCANVAS_PROJECT_NOT_FOUND", "TapCanvas project does not exist", gcode.CodeNotFound)
	// CodeInvalidInput reports invalid project mutation input.
	CodeInvalidInput = bizerr.MustDefine("TAPCANVAS_PROJECT_INVALID_INPUT", "TapCanvas project input is invalid", gcode.CodeInvalidParameter)
	// CodeQueryFailed reports project query failures.
	CodeQueryFailed = bizerr.MustDefine("TAPCANVAS_PROJECT_QUERY_FAILED", "Failed to query TapCanvas projects", gcode.CodeInternalError)
	// CodeCreateFailed reports project creation failures.
	CodeCreateFailed = bizerr.MustDefine("TAPCANVAS_PROJECT_CREATE_FAILED", "Failed to create TapCanvas project", gcode.CodeInternalError)
	// CodeUpdateFailed reports project update failures.
	CodeUpdateFailed = bizerr.MustDefine("TAPCANVAS_PROJECT_UPDATE_FAILED", "Failed to update TapCanvas project", gcode.CodeInternalError)
	// CodeDeleteFailed reports project deletion failures.
	CodeDeleteFailed = bizerr.MustDefine("TAPCANVAS_PROJECT_DELETE_FAILED", "Failed to delete TapCanvas project", gcode.CodeInternalError)
)
