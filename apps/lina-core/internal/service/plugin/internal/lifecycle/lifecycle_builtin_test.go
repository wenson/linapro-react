// This file verifies dependency-aware startup ordering for built-in source
// plugins before lifecycle reconciliation performs install and enable actions.

package lifecycle

import (
	pluginv1 "lina-core/api/plugin/v1"
	"testing"

	"lina-core/internal/service/plugin/internal/catalog"
	"lina-core/internal/service/plugin/internal/plugintypes"
)

// TestOrderBuiltinManifestsPlacesDependenciesFirst verifies the Studio plugin
// is reconciled only after its built-in AI Core dependency.
func TestOrderBuiltinManifestsPlacesDependenciesFirst(t *testing.T) {
	aiCore := &catalog.Manifest{
		ID:           "linapro-ai-core",
		Type:         pluginv1.PluginTypeSource.String(),
		Distribution: pluginv1.PluginDistributionBuiltin.String(),
	}
	studio := &catalog.Manifest{
		ID:           "linapro-tapcanvas-studio",
		Type:         pluginv1.PluginTypeSource.String(),
		Distribution: pluginv1.PluginDistributionBuiltin.String(),
		Dependencies: &plugintypes.DependencySpec{
			Plugins: []*plugintypes.PluginDependencySpec{
				{ID: aiCore.ID, Version: ">=0.1.0 <0.2.0"},
			},
		},
	}

	ordered, err := orderBuiltinManifests([]*catalog.Manifest{studio, aiCore})
	if err != nil {
		t.Fatalf("expected builtin dependency ordering to succeed, got %v", err)
	}
	if len(ordered) != 2 {
		t.Fatalf("expected two ordered builtin manifests, got %d", len(ordered))
	}
	if ordered[0].ID != aiCore.ID || ordered[1].ID != studio.ID {
		t.Fatalf("expected AI Core before Studio, got %s before %s", ordered[0].ID, ordered[1].ID)
	}
}
