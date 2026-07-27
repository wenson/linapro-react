// This file normalizes handler responses and localizes user-facing error
// messages before the host writes the unified JSON payload.

package middleware

import (
	"errors"
	"mime"
	"net/http"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/net/ghttp"
	"github.com/gogf/gf/v2/util/gvalid"

	"lina-core/pkg/bizerr"
	"lina-core/pkg/logger"
)

const (
	// responseContentTypeEventStream identifies SSE responses.
	responseContentTypeEventStream = "text/event-stream"
	// responseContentTypeOctetStream identifies binary stream downloads.
	responseContentTypeOctetStream = "application/octet-stream"
	// responseContentTypeMixedReplace identifies multipart stream responses.
	responseContentTypeMixedReplace = "multipart/x-mixed-replace"
)

// runtimeHandlerResponse extends the default host response with stable
// structured-message metadata for localized business errors.
type runtimeHandlerResponse struct {
	Code          int            `json:"code" dc:"Error code"`
	Message       string         `json:"message" dc:"Localized display message"`
	Data          any            `json:"data" dc:"Result data for certain request according API definition"`
	ErrorCode     string         `json:"errorCode,omitempty" dc:"Stable machine-readable runtime error code"`
	MessageKey    string         `json:"messageKey,omitempty" dc:"Runtime i18n key used for localizing the message"`
	MessageParams map[string]any `json:"messageParams,omitempty" dc:"Runtime i18n named parameters"`
}

// Response serializes one unified JSON payload and localizes user-facing error
// text using the request-scoped locale.
func (s *serviceImpl) Response(r *ghttp.Request) {
	if r == nil {
		return
	}

	r.Middleware.Next()

	// Downstream handlers that already wrote bytes own the response body.
	if r.Response.BufferLength() > 0 || r.Response.BytesWritten() > 0 {
		return
	}

	// 304 Not Modified and 204 No Content are body-less by HTTP spec. Handlers
	// signal them via Status alone (e.g. cache revalidation), and the unified
	// JSON envelope must not turn them into a 200-with-error payload.
	if r.Response.Status == http.StatusNotModified || r.Response.Status == http.StatusNoContent {
		return
	}

	mediaType, _, _ := mime.ParseMediaType(r.Response.Header().Get("Content-Type"))
	switch mediaType {
	case responseContentTypeEventStream, responseContentTypeOctetStream, responseContentTypeMixedReplace:
		return
	}

	var (
		err  = r.GetError()
		res  = r.GetHandlerResponse()
		code gcode.Code
		msg  string
	)

	if err != nil {
		if !isPublicResponseError(err) {
			logger.Errorf(
				r.Context(),
				"unexpected request failure method=%s path=%s err=%v",
				r.Method,
				r.URL.Path,
				err,
			)
			err = bizerr.WrapCode(err, CodeMiddlewareHTTPInternalError)
			r.SetError(err)
		}

		code = gerror.Code(err)
		if code == gcode.CodeNil {
			code = gcode.CodeInternalError
		}
		msg = s.i18nSvc.LocalizeError(r.Context(), err)
	} else {
		if r.Response.Status > 0 && r.Response.Status != http.StatusOK {
			switch r.Response.Status {
			case http.StatusUnauthorized:
				err = bizerr.NewCode(CodeMiddlewareHTTPUnauthorized)
				code = gcode.CodeNotAuthorized
			case http.StatusNotFound:
				err = bizerr.NewCode(CodeMiddlewareHTTPNotFound)
				code = gcode.CodeNotFound
			case http.StatusForbidden:
				err = bizerr.NewCode(CodeMiddlewareHTTPForbidden)
				code = gcode.CodeNotAuthorized
			default:
				err = bizerr.NewCode(CodeMiddlewareHTTPError)
				code = gcode.CodeUnknown
			}
			r.SetError(err)
		} else {
			code = gcode.CodeOK
		}
		msg = s.i18nSvc.Translate(r.Context(), code.Message(), code.Message())
	}

	if msg == "" {
		msg = code.Message()
	}

	response := runtimeHandlerResponse{
		Code:    code.Code(),
		Message: msg,
		Data:    res,
	}
	applyRuntimeErrorMetadata(&response, err)
	r.Response.WriteJson(response)
}

// isPublicResponseError reports whether an error carries caller-safe business
// or validation semantics. All other errors are treated as internal failures at
// the HTTP response boundary, even when their raw text appears readable.
func isPublicResponseError(err error) bool {
	if err == nil {
		return true
	}
	if _, ok := bizerr.As(err); ok {
		return true
	}
	var validationErr gvalid.Error
	return errors.As(err, &validationErr)
}

// applyRuntimeErrorMetadata copies structured runtime-message metadata into the
// unified response when the error chain carries it.
func applyRuntimeErrorMetadata(response *runtimeHandlerResponse, err error) {
	if response == nil || err == nil {
		return
	}
	messageErr, ok := bizerr.As(err)
	if !ok {
		return
	}
	response.ErrorCode = messageErr.RuntimeCode()
	response.MessageKey = messageErr.MessageKey()
	response.MessageParams = messageErr.Params()
}
