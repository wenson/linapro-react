// This file verifies authentication business error localization metadata.

package auth

import "testing"

// TestCodeAuthInvalidCredentialsMessageKey verifies the login error resolves
// through the stable host runtime translation resource.
func TestCodeAuthInvalidCredentialsMessageKey(t *testing.T) {
	const expected = "error.auth.invalid.credentials"
	if actual := CodeAuthInvalidCredentials.MessageKey(); actual != expected {
		t.Fatalf("expected message key %q, got %q", expected, actual)
	}
}
