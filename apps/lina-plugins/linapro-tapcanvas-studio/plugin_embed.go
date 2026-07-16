// This file embeds the TapCanvas Studio manifest, frontend entries, and governed resources.

package tapcanvasstudio

import "embed"

// EmbeddedFiles contains the plugin manifest, frontend pages, and manifest resources.
//
//go:embed plugin.yaml frontend manifest
var EmbeddedFiles embed.FS
