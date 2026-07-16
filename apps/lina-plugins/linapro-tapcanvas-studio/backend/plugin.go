// Package backend registers the TapCanvas Studio managed source plugin with the LinaPro host.
package backend

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"

	"lina-core/pkg/plugin/pluginhost"
	aicorespi "lina-plugin-linapro-ai-core/backend/cap/aicap/spi"
	tapcanvasstudio "lina-plugin-linapro-tapcanvas-studio"
	chapterctrl "lina-plugin-linapro-tapcanvas-studio/backend/internal/controller/chapter"
	projectctrl "lina-plugin-linapro-tapcanvas-studio/backend/internal/controller/project"
	chaptersvc "lina-plugin-linapro-tapcanvas-studio/backend/internal/service/chapter"
	projectsvc "lina-plugin-linapro-tapcanvas-studio/backend/internal/service/project"
)

const (
	// pluginID is the immutable identifier published by the embedded Studio plugin.
	pluginID = "linapro-tapcanvas-studio"
	// aiOwnerPluginID is the manifest dependency that owns the typed AI contract.
	aiOwnerPluginID = "linapro-ai-core"
)

// init registers the embedded Studio manifest and resources. Business routes
// are added only when their later Tasklist stages provide generated contracts.
func init() {
	if aicorespi.OwnerPluginID != aiOwnerPluginID {
		err := gerror.New("linapro-tapcanvas-studio AI contract owner does not match its plugin dependency")
		panic(err)
	}
	plugin := pluginhost.NewDeclarations(pluginID)
	plugin.Assets().UseEmbeddedFiles(tapcanvasstudio.EmbeddedFiles)
	if err := plugin.HTTP().RegisterRoutes(
		pluginhost.ExtensionPointHTTPRouteRegister,
		pluginhost.CallbackExecutionModeBlocking,
		registerRoutes,
	); err != nil {
		panic(err)
	}
	if err := pluginhost.RegisterSourcePlugin(plugin); err != nil {
		panic(err)
	}
}

// registerRoutes constructs the shared project/chapter service graph and binds
// all Studio APIs behind host authentication, Tenancy, and permission middleware.
func registerRoutes(_ context.Context, registrar pluginhost.HTTPRegistrar) error {
	var (
		routes      = registrar.Routes()
		middlewares = routes.Middlewares()
		services    = registrar.Services()
	)
	if services == nil || services.Auth() == nil || services.Auth().Authz() == nil || services.BizCtx() == nil || services.Tenant() == nil || services.Tenant().Filter() == nil {
		return gerror.New("linapro-tapcanvas-studio routes require host authz, bizctx, and tenant-filter services")
	}
	projectSvc := projectsvc.New(services.BizCtx(), services.Tenant(), services.Auth().Authz(), g.DB())
	chapterSvc := chaptersvc.New(services.BizCtx(), services.Tenant(), services.Auth().Authz(), g.DB(), projectSvc)
	projectController := projectctrl.NewV1(projectSvc)
	chapterController := chapterctrl.NewV1(chapterSvc)

	routes.Group(routes.APIPrefix(), func(group pluginhost.RouteGroup) {
		group.Group("/api/v1", func(group pluginhost.RouteGroup) {
			group.Middleware(
				middlewares.NeverDoneCtx(),
				middlewares.HandlerResponse(),
				middlewares.CORS(),
				middlewares.RequestBodyLimit(),
				middlewares.Ctx(),
				middlewares.Auth(),
				middlewares.Tenancy(),
				middlewares.Permission(),
			)
			group.Bind(projectController, chapterController)
		})
	})
	return nil
}
