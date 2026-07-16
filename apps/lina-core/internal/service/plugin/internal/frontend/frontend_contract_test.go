// This file covers runtime hosted-menu validation against isolated HTML assets.

package frontend_test

import (
	"context"
	"encoding/base64"
	"path/filepath"
	"strings"
	"testing"

	pluginv1 "lina-core/api/plugin/v1"
	"lina-core/internal/model/entity"
	"lina-core/internal/service/plugin/internal/catalog"
	"lina-core/internal/service/plugin/internal/testutil"
	"lina-core/pkg/plugin/pluginhost"
)

// TestValidateHostedMenuBindingsAcceptsIsolatedHTMLModes verifies iframe and
// new-window dynamic pages bind current-plugin HTML assets behind internal routes.
func TestValidateHostedMenuBindingsAcceptsIsolatedHTMLModes(t *testing.T) {
	var (
		services = testutil.NewServices()
		service  = services.Frontend
	)
	resetBundleCache(t, service)

	manifest := createHostedContractManifest(t, services, []*catalog.ArtifactFrontendAsset{
		{
			Path:          "frontend/pages/standalone.html",
			ContentBase64: base64.StdEncoding.EncodeToString([]byte("<html><body>hosted entry</body></html>")),
			ContentType:   "text/html; charset=utf-8",
		},
	})
	hostedURL := service.BuildRuntimeFrontendPublicBaseURL(manifest.ID, manifest.Version) + "standalone.html"
	menus := []*entity.SysMenu{
		{
			MenuKey:    "plugin:plugin-dev-dynamic-bindings:iframe-entry",
			Name:       "Hosted iframe entry",
			Path:       "/extension/plugin-dev-dynamic-bindings",
			Component:  pluginhost.DynamicPageComponentPath,
			QueryParam: `{"pluginAccessMode":"iframe","pluginAssetUrl":"` + hostedURL + `"}`,
		},
		{
			MenuKey:    "plugin:plugin-dev-dynamic-bindings:new-window-entry",
			Name:       "Hosted new window entry",
			Path:       "/extension/plugin-dev-dynamic-bindings-window",
			Component:  pluginhost.DynamicPageComponentPath,
			QueryParam: `{"pluginAccessMode":"new-window","pluginAssetUrl":"` + hostedURL + `"}`,
		},
	}

	if err := service.ValidateHostedMenuBindings(context.Background(), manifest, menus); err != nil {
		t.Fatalf("expected isolated hosted menu bindings to be valid, got error: %v", err)
	}
}

// TestValidateHostedMenuBindingsRejectsUnsafeContracts verifies legacy ESM,
// cross-plugin, missing, and non-HTML targets never reach the workbench.
func TestValidateHostedMenuBindingsRejectsUnsafeContracts(t *testing.T) {
	var (
		services = testutil.NewServices()
		service  = services.Frontend
	)
	resetBundleCache(t, service)

	manifest := createHostedContractManifest(t, services, []*catalog.ArtifactFrontendAsset{
		{
			Path:          "frontend/pages/standalone.html",
			ContentBase64: base64.StdEncoding.EncodeToString([]byte("<html><body>hosted entry</body></html>")),
			ContentType:   "text/html; charset=utf-8",
		},
		{
			Path:          "frontend/pages/mount.js",
			ContentBase64: base64.StdEncoding.EncodeToString([]byte("export function mount() {}")),
			ContentType:   "application/javascript",
		},
	})
	baseURL := service.BuildRuntimeFrontendPublicBaseURL(manifest.ID, manifest.Version)
	tests := []struct {
		name          string
		query         string
		expectedError string
	}{
		{
			name:          "legacy embedded mount",
			query:         `{"embeddedSrc":"` + baseURL + `mount.js","pluginAccessMode":"embedded-mount"}`,
			expectedError: "legacy",
		},
		{
			name:          "non HTML entry",
			query:         `{"pluginAccessMode":"iframe","pluginAssetUrl":"` + baseURL + `mount.js"}`,
			expectedError: ".html",
		},
		{
			name:          "other plugin asset",
			query:         `{"pluginAccessMode":"iframe","pluginAssetUrl":"/x-assets/plugin-other/v0.3.0/standalone.html"}`,
			expectedError: "current plugin version",
		},
		{
			name:          "missing asset",
			query:         `{"pluginAccessMode":"iframe","pluginAssetUrl":"` + baseURL + `missing.html"}`,
			expectedError: "missing runtime public asset",
		},
		{
			name:          "unsupported mode",
			query:         `{"pluginAccessMode":"inline","pluginAssetUrl":"` + baseURL + `standalone.html"}`,
			expectedError: "iframe or new-window",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			menu := &entity.SysMenu{
				MenuKey:    "plugin:plugin-dev-dynamic-bindings:unsafe-entry",
				Name:       tt.name,
				Path:       "/extension/plugin-dev-dynamic-bindings",
				Component:  pluginhost.DynamicPageComponentPath,
				QueryParam: tt.query,
			}
			err := service.ValidateHostedMenuBindings(context.Background(), manifest, []*entity.SysMenu{menu})
			if err == nil || !strings.Contains(err.Error(), tt.expectedError) {
				t.Fatalf("expected error containing %q, got %v", tt.expectedError, err)
			}
		})
	}
}

// createHostedContractManifest creates one self-contained dynamic manifest
// with public assets embedded in its runtime artifact.
func createHostedContractManifest(
	t *testing.T,
	services *testutil.Services,
	assets []*catalog.ArtifactFrontendAsset,
) *catalog.Manifest {
	t.Helper()
	pluginDir := testutil.CreateTestRuntimePluginDirWithFrontendAssets(
		t,
		"plugin-dev-dynamic-bindings",
		"Runtime Binding Plugin",
		"v0.3.0",
		assets,
		nil,
		nil,
	)
	manifest := &catalog.Manifest{
		ID:           "plugin-dev-dynamic-bindings",
		Name:         "Runtime Binding Plugin",
		Version:      "v0.3.0",
		Type:         pluginv1.PluginTypeDynamic.String(),
		ManifestPath: filepath.Join(pluginDir, "plugin.yaml"),
		RootDir:      pluginDir,
	}
	if err := services.Catalog.ValidateManifest(manifest, manifest.ManifestPath); err != nil {
		t.Fatalf("expected dynamic manifest to be valid, got error: %v", err)
	}
	return manifest
}
