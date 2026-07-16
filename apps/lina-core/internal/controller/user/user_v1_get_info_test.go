// This file covers home-path resolution so login redirects prefer stable host
// pages before isolated dynamic plugin workbench entries.

package user

import (
	"testing"

	"lina-core/internal/service/menu"
	"lina-core/pkg/menutype"
	"lina-core/pkg/plugin/pluginhost"
)

// TestResolveHomePathPrefersStableHostRoutes verifies stable workspace routes
// are chosen before hosted plugin-asset entries.
func TestResolveHomePathPrefersStableHostRoutes(t *testing.T) {
	items := []*menu.MenuItem{
		{
			Name:      "源码插件示例",
			Path:      "linapro-demo-source-sidebar-entry",
			Component: pluginhost.DynamicPageComponentPath,
			Type:      menutype.Menu.String(),
		},
		{
			Name: "工作台",
			Path: "dashboard",
			Type: menutype.Directory.String(),
			Children: []*menu.MenuItem{
				{
					Name: "分析页",
					Path: "analytics",
					Type: menutype.Menu.String(),
				},
				{
					Name: "工作台",
					Path: "workspace",
					Type: menutype.Menu.String(),
				},
			},
		},
		{
			Name: "动态插件示例",
			Path: "/extension/linapro-demo-dynamic",
			Type: menutype.Menu.String(),
		},
	}

	if got := resolveHomePath(items); got != "/dashboard/analytics" {
		t.Fatalf("expected stable host route /dashboard/analytics, got %s", got)
	}
}

// TestResolveHomePathFallsBackToDynamicPluginRouteWhenNeeded verifies internal
// dynamic plugin routes remain eligible when no earlier host route exists.
func TestResolveHomePathFallsBackToDynamicPluginRouteWhenNeeded(t *testing.T) {
	items := []*menu.MenuItem{
		{
			Name: "动态插件示例",
			Path: "/extension/linapro-demo-dynamic",
			Type: menutype.Menu.String(),
		},
	}

	if got := resolveHomePath(items); got != "/extension/linapro-demo-dynamic" {
		t.Fatalf("expected dynamic plugin route fallback, got %s", got)
	}
}
