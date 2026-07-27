// This file verifies unified response metadata helpers.
package middleware

import (
	"context"
	"testing"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/util/gvalid"

	"lina-core/pkg/bizerr"
)

// TestApplyRuntimeErrorMetadataCopiesStructuredFields verifies the response
// envelope exposes stable structured-error metadata for frontend localization.
func TestApplyRuntimeErrorMetadataCopiesStructuredFields(t *testing.T) {
	t.Parallel()

	response := &runtimeHandlerResponse{}
	code := bizerr.MustDefine(
		"USER_NOT_FOUND",
		"User {username} does not exist",
		gcode.CodeNotFound,
	)
	err := bizerr.NewCode(code, bizerr.P("username", "alice"))

	applyRuntimeErrorMetadata(response, err)
	if response.ErrorCode != "USER_NOT_FOUND" {
		t.Fatalf("expected error code %q, got %q", "USER_NOT_FOUND", response.ErrorCode)
	}
	if response.MessageKey != "error.user.not.found" {
		t.Fatalf("expected message key %q, got %q", "error.user.not.found", response.MessageKey)
	}
	if response.MessageParams["username"] != "alice" {
		t.Fatalf("expected message parameter username=%q, got %v", "alice", response.MessageParams["username"])
	}
}

// TestIsPublicResponseErrorRejectsTechnicalErrors verifies database and other
// unclassified failures cannot be rendered directly into the HTTP response.
func TestIsPublicResponseErrorRejectsTechnicalErrors(t *testing.T) {
	t.Parallel()

	technicalErr := gerror.New("database query failed: SELECT secret FROM sys_config")
	if isPublicResponseError(technicalErr) {
		t.Fatal("expected unclassified technical error to be private")
	}

	publicErr := bizerr.WrapCode(technicalErr, CodeMiddlewareHTTPInternalError)
	if !isPublicResponseError(publicErr) {
		t.Fatal("expected normalized internal error to carry public-safe metadata")
	}
	messageErr, ok := bizerr.As(publicErr)
	if !ok {
		t.Fatal("expected normalized internal error to be structured")
	}
	if messageErr.RuntimeCode() != "HTTP_INTERNAL_ERROR" {
		t.Fatalf("expected stable internal error code, got %q", messageErr.RuntimeCode())
	}
	if messageErr.Fallback() == technicalErr.Error() {
		t.Fatal("expected public fallback to hide the technical cause")
	}
}

// TestIsPublicResponseErrorAllowsBusinessErrors verifies existing structured
// business failures keep their caller-safe semantics.
func TestIsPublicResponseErrorAllowsBusinessErrors(t *testing.T) {
	t.Parallel()

	err := bizerr.NewCode(CodeMiddlewareHTTPNotFound)
	if !isPublicResponseError(err) {
		t.Fatal("expected structured business error to remain public")
	}

	validationErr := gvalid.New().Data("").Rules("required").Run(context.Background())
	if validationErr == nil {
		t.Fatal("expected required validation to fail")
	}
	if !isPublicResponseError(validationErr) {
		t.Fatal("expected validation error to remain public")
	}
}
