// chapter_code.go defines stable TapCanvas chapter business errors.

package chapter

import (
	"github.com/gogf/gf/v2/errors/gcode"

	"lina-core/pkg/bizerr"
)

var (
	// CodeContextRequired reports missing authenticated Tenant context.
	CodeContextRequired = bizerr.MustDefine("TAPCANVAS_CHAPTER_CONTEXT_REQUIRED", "Enter a LinaPro Tenant before using TapCanvas chapters", gcode.CodeNotAuthorized)
	// CodeForbidden reports missing chapter permission.
	CodeForbidden = bizerr.MustDefine("TAPCANVAS_CHAPTER_FORBIDDEN", "You do not have access to this TapCanvas chapter operation", gcode.CodeNotAuthorized)
	// CodeNotFound hides missing and out-of-scope chapters behind one response.
	CodeNotFound = bizerr.MustDefine("TAPCANVAS_CHAPTER_NOT_FOUND", "TapCanvas chapter does not exist", gcode.CodeNotFound)
	// CodeInvalidInput reports invalid mutable chapter fields.
	CodeInvalidInput = bizerr.MustDefine("TAPCANVAS_CHAPTER_INVALID_INPUT", "TapCanvas chapter input is invalid", gcode.CodeInvalidParameter)
	// CodeInvalidStatus reports an unsupported chapter status.
	CodeInvalidStatus = bizerr.MustDefine("TAPCANVAS_CHAPTER_INVALID_STATUS", "TapCanvas chapter status is invalid", gcode.CodeInvalidParameter)
	// CodeReorderMismatch reports incomplete, duplicate, or invisible reorder targets.
	CodeReorderMismatch = bizerr.MustDefine("TAPCANVAS_CHAPTER_REORDER_MISMATCH", "Chapter order must contain every visible project chapter exactly once", gcode.CodeInvalidParameter)
	// CodeQueryFailed reports chapter query failures.
	CodeQueryFailed = bizerr.MustDefine("TAPCANVAS_CHAPTER_QUERY_FAILED", "Failed to query TapCanvas chapters", gcode.CodeInternalError)
	// CodeCreateFailed reports chapter creation failures.
	CodeCreateFailed = bizerr.MustDefine("TAPCANVAS_CHAPTER_CREATE_FAILED", "Failed to create TapCanvas chapter", gcode.CodeInternalError)
	// CodeUpdateFailed reports chapter update failures.
	CodeUpdateFailed = bizerr.MustDefine("TAPCANVAS_CHAPTER_UPDATE_FAILED", "Failed to update TapCanvas chapter", gcode.CodeInternalError)
	// CodeDeleteFailed reports chapter deletion failures.
	CodeDeleteFailed = bizerr.MustDefine("TAPCANVAS_CHAPTER_DELETE_FAILED", "Failed to delete TapCanvas chapter", gcode.CodeInternalError)
	// CodeReorderFailed reports atomic chapter reorder failures.
	CodeReorderFailed = bizerr.MustDefine("TAPCANVAS_CHAPTER_REORDER_FAILED", "Failed to reorder TapCanvas chapters", gcode.CodeInternalError)
)
