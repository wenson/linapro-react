// This file verifies dependency-aware startup ordering for built-in source
// plugins before lifecycle reconciliation performs install and enable actions.

package lifecycle

import (
	pluginv1 "lina-core/api/plugin/v1"
	"testing"

	"lina-core/internal/service/plugin/internal/catalog"
	"lina-core/internal/service/plugin/internal/plugintypes"
)

// TestOrderBuiltinManifestsPlacesDependenciesFirst verifies a dependent
// built-in plugin is reconciled only after its built-in dependency.
func TestOrderBuiltinManifestsPlacesDependenciesFirst(t *testing.T) {
	dependency := &catalog.Manifest{
		ID:           "linapro-example-dependency",
		Type:         pluginv1.PluginTypeSource.String(),
		Distribution: pluginv1.PluginDistributionBuiltin.String(),
	}
	dependent := &catalog.Manifest{
		ID:           "linapro-example-dependent",
		Type:         pluginv1.PluginTypeSource.String(),
		Distribution: pluginv1.PluginDistributionBuiltin.String(),
		Dependencies: &plugintypes.DependencySpec{
			Plugins: []*plugintypes.PluginDependencySpec{
				{ID: dependency.ID, Version: ">=0.1.0 <0.2.0"},
			},
		},
	}

	ordered, err := orderBuiltinManifests([]*catalog.Manifest{dependent, dependency})
	if err != nil {
		t.Fatalf("expected builtin dependency ordering to succeed, got %v", err)
	}
	if len(ordered) != 2 {
		t.Fatalf("expected two ordered builtin manifests, got %d", len(ordered))
	}
	if ordered[0].ID != dependency.ID || ordered[1].ID != dependent.ID {
		t.Fatalf("expected dependency before dependent plugin, got %s before %s", ordered[0].ID, ordered[1].ID)
	}
}
