package menu

import (
	"testing"

	"lina-core/internal/model/entity"
	menusvc "lina-core/internal/service/menu"
	"lina-core/pkg/menutype"
)

// TestConvertToRouteItemsBuildsIframeRouteForHostedXAssets verifies hosted
// asset menus default to iframe routes when they are not marked as new-window
// or embedded-mount entries.
func TestConvertToRouteItemsBuildsIframeRouteForHostedXAssets(t *testing.T) {
	routes := convertToRouteItems([]*menusvc.MenuItem{
		{
			Id:      101,
			Name:    "Runtime Iframe Entry",
			Path:    "/x-assets/plugin-runtime-demo/v0.1.0/index.html",
			Type:    menutype.Menu.String(),
			IsFrame: 0,
			Visible: 1,
			Status:  1,
		},
	})

	if len(routes) != 1 {
		t.Fatalf("expected 1 route, got %d", len(routes))
	}

	route := routes[0]
	if route.Component != "IFrameView" {
		t.Fatalf("expected iframe route component, got %s", route.Component)
	}
	if route.Meta == nil || route.Meta.IframeSrc != "/x-assets/plugin-runtime-demo/v0.1.0/index.html" {
		t.Fatalf("expected iframe src to be preserved, got %#v", route.Meta)
	}
	if route.Path == "/x-assets/plugin-runtime-demo/v0.1.0/index.html" {
		t.Fatalf("expected virtual router path instead of raw asset path, got %s", route.Path)
	}
}

// TestConvertToRouteItemsBuildsNewWindowRouteForHostedXAssets verifies
// hosted asset menus marked as frames become new-window link routes.
func TestConvertToRouteItemsBuildsNewWindowRouteForHostedXAssets(t *testing.T) {
	routes := convertToRouteItems([]*menusvc.MenuItem{
		{
			Id:      102,
			Name:    "Runtime New Window Entry",
			Path:    "/x-assets/plugin-runtime-demo/v0.1.0/index.html",
			Type:    menutype.Menu.String(),
			IsFrame: 1,
			Visible: 1,
			Status:  1,
		},
	})

	if len(routes) != 1 {
		t.Fatalf("expected 1 route, got %d", len(routes))
	}

	route := routes[0]
	if route.Component != "BasicLayout" {
		t.Fatalf("expected new-window route to keep basic layout component, got %s", route.Component)
	}
	if route.Meta == nil || route.Meta.Link != "/x-assets/plugin-runtime-demo/v0.1.0/index.html" {
		t.Fatalf("expected link target to be preserved, got %#v", route.Meta)
	}
	if !route.Meta.OpenInNewWindow {
		t.Fatalf("expected route to open in new window")
	}
}

// TestConvertToRouteItemsBuildsDynamicIframeRoute verifies isolated dynamic
// pages keep an internal route and expose only governed iframe metadata.
func TestConvertToRouteItemsBuildsDynamicIframeRoute(t *testing.T) {
	routes := convertToRouteItems([]*menusvc.MenuItem{
		{
			Id:         103,
			Name:       "Runtime Isolated Entry",
			MenuKey:    "plugin:plugin-runtime-demo:main-entry",
			Path:       "/extension/plugin-runtime-demo",
			Component:  "system/plugin/dynamic-page",
			Type:       menutype.Menu.String(),
			IsFrame:    0,
			Visible:    1,
			Status:     1,
			QueryParam: `{"pluginAccessMode":"iframe","pluginAssetUrl":"/x-assets/plugin-runtime-demo/v0.1.0/standalone.html"}`,
		},
	})

	if len(routes) != 1 {
		t.Fatalf("expected 1 route, got %d", len(routes))
	}

	route := routes[0]
	if route.Component != "#/views/system/plugin/dynamic-page" {
		t.Fatalf("expected isolated route to keep runtime host component, got %s", route.Component)
	}
	if route.Meta == nil || route.Meta.Query == nil {
		t.Fatalf("expected isolated route query to be present, got %#v", route.Meta)
	}
	if route.Meta.Query["pluginAccessMode"] != "iframe" {
		t.Fatalf("expected iframe access mode query, got %#v", route.Meta.Query)
	}
	if route.Meta.Query["pluginAssetUrl"] != "/x-assets/plugin-runtime-demo/v0.1.0/standalone.html" {
		t.Fatalf("expected governed HTML asset URL to be preserved, got %#v", route.Meta.Query)
	}
	if route.Meta.PluginID != "plugin-runtime-demo" {
		t.Fatalf("expected plugin owner projection, got %#v", route.Meta)
	}
	if route.Path != "/extension/plugin-runtime-demo" {
		t.Fatalf("expected internal host route, got %s", route.Path)
	}
}

// TestConvertToRouteItemsRejectsLegacyDynamicMount verifies stale persisted
// embedded-mount metadata cannot re-enter the React workbench route tree.
func TestConvertToRouteItemsRejectsLegacyDynamicMount(t *testing.T) {
	routes := convertToRouteItems([]*menusvc.MenuItem{{
		Id:         104,
		Name:       "Legacy Runtime Entry",
		MenuKey:    "plugin:plugin-runtime-demo:legacy-entry",
		Path:       "/extension/plugin-runtime-demo-legacy",
		Component:  "system/plugin/dynamic-page",
		Type:       menutype.Menu.String(),
		Visible:    1,
		Status:     1,
		QueryParam: `{"embeddedSrc":"/x-assets/plugin-runtime-demo/v0.1.0/mount.js","pluginAccessMode":"embedded-mount"}`,
	}})

	if len(routes) != 0 {
		t.Fatalf("expected legacy dynamic route to be rejected, got %#v", routes)
	}
}

// TestConvertToRouteItemsKeepsRegularViewRouteUnchanged verifies normal
// workspace views are not rewritten by hosted-link conversion logic.
func TestConvertToRouteItemsKeepsRegularViewRouteUnchanged(t *testing.T) {
	routes := convertToRouteItems([]*menusvc.MenuItem{
		{
			Id:        105,
			Name:      "Plugin Demo Source",
			Path:      "linapro-demo-source-sidebar-entry",
			Component: "system/plugin/dynamic-page",
			Type:      menutype.Menu.String(),
			IsFrame:   0,
			Visible:   1,
			Status:    1,
		},
	})

	if len(routes) != 1 {
		t.Fatalf("expected 1 route, got %d", len(routes))
	}

	route := routes[0]
	if route.Component != "#/views/system/plugin/dynamic-page" {
		t.Fatalf("expected host view component, got %s", route.Component)
	}
	if route.Meta == nil || route.Meta.IframeSrc != "" || route.Meta.Link != "" {
		t.Fatalf("expected regular route meta to stay without link semantics, got %#v", route.Meta)
	}
	if route.Path != "/linapro-demo-source-sidebar-entry" {
		t.Fatalf("expected normal menu path, got %s", route.Path)
	}
}

// TestConvertToRouteItemsKeepsAbsoluteChildPath verifies grouped directory
// menus can keep child routes on their original absolute URLs.
func TestConvertToRouteItemsKeepsAbsoluteChildPath(t *testing.T) {
	routes := convertToRouteItems([]*menusvc.MenuItem{
		{
			Id:      201,
			Name:    "定时任务",
			Path:    "scheduled-job",
			Type:    menutype.Directory.String(),
			Visible: 1,
			Status:  1,
			Children: []*menusvc.MenuItem{
				{
					Id:        202,
					ParentId:  201,
					Name:      "任务管理",
					Path:      "/system/job",
					Component: "system/job/index",
					Type:      menutype.Menu.String(),
					Visible:   1,
					Status:    1,
				},
			},
		},
	})

	if len(routes) != 1 {
		t.Fatalf("expected 1 directory route, got %d", len(routes))
	}
	if len(routes[0].Children) != 1 {
		t.Fatalf("expected 1 child route, got %#v", routes[0].Children)
	}
	if routes[0].Children[0].Path != "/system/job" {
		t.Fatalf("expected absolute child path to be preserved, got %q", routes[0].Children[0].Path)
	}
}

// TestConvertToRouteItemsSkipsDirectoryWithoutVisibleChildren verifies host
// directory menus disappear once all child nodes are filtered out.
func TestConvertToRouteItemsSkipsDirectoryWithoutVisibleChildren(t *testing.T) {
	routes := convertToRouteItems([]*menusvc.MenuItem{
		{
			Id:      301,
			Name:    "系统监控",
			Path:    "monitor",
			Type:    menutype.Directory.String(),
			Visible: 1,
			Status:  1,
			Children: []*menusvc.MenuItem{
				{
					Id:       302,
					ParentId: 301,
					Name:     "操作日志查看",
					Path:     "linapro-monitor-operlog-view",
					Type:     menutype.Button.String(),
					Visible:  1,
					Status:   1,
				},
			},
		},
	})

	if len(routes) != 0 {
		t.Fatalf("expected empty directory route to be hidden, got %#v", routes)
	}
}

// TestBuildFilteredTreeKeepsAncestors verifies selected leaf menus project the
// full ancestor chain required by the stable host catalog tree.
func TestBuildFilteredTreeKeepsAncestors(t *testing.T) {
	menuTree := buildFilteredTree([]*entity.SysMenu{
		{Id: 1, Name: "权限管理", Path: "iam", Type: menutype.Directory.String(), Visible: 1, Status: 1},
		{Id: 2, ParentId: 1, Name: "用户治理", Path: "iam-user", Type: menutype.Directory.String(), Visible: 1, Status: 1},
		{Id: 3, ParentId: 2, Name: "用户管理", Path: "/system/user", Component: "system/user/index", Type: menutype.Menu.String(), Visible: 1, Status: 1},
	}, []int{3})

	if len(menuTree) != 1 {
		t.Fatalf("expected one root ancestor, got %#v", menuTree)
	}
	if len(menuTree[0].Children) != 1 {
		t.Fatalf("expected one middle ancestor, got %#v", menuTree[0].Children)
	}
	if len(menuTree[0].Children[0].Children) != 1 {
		t.Fatalf("expected selected leaf to remain attached, got %#v", menuTree[0].Children[0].Children)
	}
	if menuTree[0].Children[0].Children[0].Id != 3 {
		t.Fatalf("expected selected leaf id=3, got %#v", menuTree[0].Children[0].Children[0])
	}
}
