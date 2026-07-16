// This file validates how dynamic plugin menus consume hosted public assets.
// The host only serves assets declared by plugin.yaml public_assets, and
// enable-time validation prevents broken runtime menus from entering the router.

package frontend

import (
	"context"
	"encoding/json"
	"fmt"
	pluginv1 "lina-core/api/plugin/v1"
	"path"
	"strings"

	"github.com/gogf/gf/v2/errors/gerror"

	"lina-core/internal/dao"
	"lina-core/internal/model/entity"
	"lina-core/internal/service/plugin/internal/catalog"
	"lina-core/internal/service/plugin/internal/plugintypes"
	"lina-core/pkg/plugin/pluginhost"
)

// hostedHTMLExtension is the only supported dynamic hosted-page entry extension.
const hostedHTMLExtension = ".html"

// ValidateRuntimeFrontendMenuBindings verifies that dynamic plugin menus only
// reference declared public assets that exist in the plugin's in-memory bundle.
func (s *serviceImpl) ValidateRuntimeFrontendMenuBindings(ctx context.Context, manifest *catalog.Manifest) error {
	if manifest == nil || plugintypes.NormalizeType(manifest.Type) != pluginv1.PluginTypeDynamic {
		return nil
	}

	menus, err := s.listPluginOwnedMenus(ctx, manifest.ID)
	if err != nil {
		return err
	}
	return s.validateHostedMenuBindings(ctx, manifest, menus)
}

// listPluginOwnedMenus loads menus owned by the target plugin so hosted asset
// validation can inspect persisted menu bindings.
func (s *serviceImpl) listPluginOwnedMenus(ctx context.Context, pluginID string) ([]*entity.SysMenu, error) {
	columns := dao.SysMenu.Columns()
	prefixPattern := plugintypes.MenuKeyPrefix + pluginID + ":%"

	var menus []*entity.SysMenu
	if err := dao.SysMenu.Ctx(ctx).
		WhereLike(columns.MenuKey, prefixPattern).
		OrderAsc(columns.Id).
		Scan(&menus); err != nil {
		return nil, err
	}
	return menus, nil
}

// validateHostedMenuBindings enforces that plugin menus only point at declared
// hosted public HTML assets that exist and satisfy the isolated-page contract.
func (s *serviceImpl) validateHostedMenuBindings(ctx context.Context, manifest *catalog.Manifest, menus []*entity.SysMenu) error {
	if manifest == nil || manifest.RuntimeArtifact == nil || len(menus) == 0 {
		return nil
	}

	var b *bundle
	for _, menu := range menus {
		if menu == nil || plugintypes.ParsePluginIDFromMenuKey(menu.MenuKey) != manifest.ID {
			continue
		}

		queryParams, err := parseMenuQueryParams(menu.QueryParam)
		if err != nil {
			return wrapMenuValidationError(menu, err)
		}
		assetURL, err := hostedMenuAssetURL(menu, queryParams)
		if err != nil {
			return wrapMenuValidationError(menu, err)
		}
		relativeAssetPath, usesHostedAsset, err := s.resolveHostedMenuAssetPath(manifest, assetURL)
		if err != nil {
			return wrapMenuValidationError(menu, err)
		}
		if !usesHostedAsset {
			if strings.TrimSpace(menu.Component) == pluginhost.DynamicPageComponentPath {
				return wrapMenuValidationError(menu, gerror.New("dynamic hosted page must declare a current-plugin /x-assets/ HTML URL"))
			}
			continue
		}

		if b == nil {
			b, err = s.ensureBundle(ctx, manifest)
			if err != nil {
				return wrapMenuValidationError(menu, err)
			}
		}
		resolvedAssetPath, assetErr := resolvePublicAssetDeclaration(manifest.PublicAssets, relativeAssetPath)
		if assetErr != nil {
			return wrapMenuValidationError(menu, assetErr)
		}
		if !b.HasAsset(resolvedAssetPath) {
			return wrapMenuValidationError(
				menu,
				gerror.Newf("menu references missing runtime public asset: %s", resolvedAssetPath),
			)
		}

		if err = validateHostedMenuMode(menu, queryParams, relativeAssetPath); err != nil {
			return wrapMenuValidationError(menu, err)
		}
	}
	return nil
}

// hostedMenuAssetURL selects the governed asset source for one menu. Dynamic
// shell routes use pluginAssetUrl; generic hosted links continue to use path.
func hostedMenuAssetURL(menu *entity.SysMenu, queryParams map[string]string) (string, error) {
	if menu == nil {
		return "", nil
	}
	if _, ok := queryParams["embeddedSrc"]; ok {
		return "", gerror.New("legacy embeddedSrc is not supported")
	}
	accessMode := strings.TrimSpace(queryParams[pluginhost.DynamicAccessModeQueryKey])
	if accessMode == "embedded-mount" {
		return "", gerror.New("legacy embedded-mount is not supported")
	}
	if strings.TrimSpace(menu.Component) != pluginhost.DynamicPageComponentPath {
		if accessMode != "" || strings.TrimSpace(queryParams[pluginhost.DynamicPluginAssetURLQueryKey]) != "" {
			return "", gerror.Newf("dynamic hosted query requires component %s", pluginhost.DynamicPageComponentPath)
		}
		return menu.Path, nil
	}
	return strings.TrimSpace(queryParams[pluginhost.DynamicPluginAssetURLQueryKey]), nil
}

// resolveHostedMenuAssetPath extracts the public URL-relative asset path when
// a menu points at one host-served plugin public asset.
func (s *serviceImpl) resolveHostedMenuAssetPath(
	manifest *catalog.Manifest,
	menuPath string,
) (string, bool, error) {
	normalizedPath := normalizeHostedMenuPath(menuPath)
	if !strings.HasPrefix(normalizedPath, pluginhost.HostedAssetURLPrefix) {
		return "", false, nil
	}

	expectedPrefix := s.BuildRuntimeFrontendPublicBaseURL(manifest.ID, manifest.Version)
	if !strings.HasPrefix(normalizedPath, expectedPrefix) {
		return "", true, gerror.Newf(
			"menu must reference hosted assets from the current plugin version: expected prefix %s",
			expectedPrefix,
		)
	}

	relativeAssetPath := strings.TrimPrefix(normalizedPath, expectedPrefix)
	return NormalizeAssetPath(relativeAssetPath), true, nil
}

// ValidateHostedMenuBindings is the exported form of validateHostedMenuBindings for cross-package access.
func (s *serviceImpl) ValidateHostedMenuBindings(ctx context.Context, manifest *catalog.Manifest, menus []*entity.SysMenu) error {
	return s.validateHostedMenuBindings(ctx, manifest, menus)
}

// wrapMenuValidationError enriches hosted-menu validation errors with menu identity.
func wrapMenuValidationError(menu *entity.SysMenu, err error) error {
	if menu == nil {
		return err
	}
	return gerror.Wrapf(err, "plugin menu validation failed [%s/%s]", strings.TrimSpace(menu.Name), strings.TrimSpace(menu.MenuKey))
}

// normalizeHostedMenuPath normalizes menu paths into absolute-style paths.
func normalizeHostedMenuPath(menuPath string) string {
	trimmedPath := strings.TrimSpace(menuPath)
	if trimmedPath == "" {
		return ""
	}
	if strings.HasPrefix(trimmedPath, "/") {
		return trimmedPath
	}
	return "/" + trimmedPath
}

// parseMenuQueryParams decodes stored menu query JSON into a string map used
// by hosted-menu contract validation.
func parseMenuQueryParams(rawQuery string) (map[string]string, error) {
	trimmedQuery := strings.TrimSpace(rawQuery)
	if trimmedQuery == "" {
		return map[string]string{}, nil
	}

	var decoded map[string]interface{}
	if err := json.Unmarshal([]byte(trimmedQuery), &decoded); err != nil {
		return nil, gerror.Wrap(err, "menu query_param is not valid JSON")
	}

	queryParams := make(map[string]string, len(decoded))
	for key, value := range decoded {
		if strings.TrimSpace(key) == "" {
			continue
		}
		queryParams[key] = fmt.Sprint(value)
	}
	return queryParams, nil
}

// validateHostedMenuMode enforces isolated iframe/new-window HTML entries and
// rejects all former host-DOM mounting inputs.
func validateHostedMenuMode(
	menu *entity.SysMenu,
	queryParams map[string]string,
	relativeAssetPath string,
) error {
	var (
		componentPath      = strings.TrimSpace(menu.Component)
		accessMode         = strings.TrimSpace(queryParams[pluginhost.DynamicAccessModeQueryKey])
		isDynamicComponent = componentPath == pluginhost.DynamicPageComponentPath
	)

	if isDynamicComponent {
		if accessMode != pluginhost.DynamicAccessModeIframe && accessMode != pluginhost.DynamicAccessModeNewWindow {
			return gerror.New("pluginAccessMode only supports iframe or new-window")
		}
		if strings.TrimSpace(queryParams[pluginhost.DynamicPluginAssetURLQueryKey]) == "" {
			return gerror.New("pluginAssetUrl is required")
		}
		if menu.IsFrame != 0 {
			return gerror.New("dynamic hosted menus cannot combine pluginAccessMode with is_frame")
		}
	}
	if strings.ToLower(path.Ext(relativeAssetPath)) != hostedHTMLExtension {
		return gerror.New("hosted frontend entry must point to a .html asset")
	}
	return nil
}
