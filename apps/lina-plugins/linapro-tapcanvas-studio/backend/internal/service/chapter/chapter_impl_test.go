// chapter_impl_test.go verifies chapter status and atomic reorder validation helpers.

package chapter

import (
	"strings"
	"testing"

	"lina-core/pkg/bizerr"
)

// TestValidStatusCoversDictionaryValues verifies every frozen dictionary value is accepted.
func TestValidStatusCoversDictionaryValues(t *testing.T) {
	statuses := []ChapterStatus{
		ChapterStatusDraft,
		ChapterStatusPlanning,
		ChapterStatusProducing,
		ChapterStatusReview,
		ChapterStatusApproved,
		ChapterStatusLocked,
		ChapterStatusArchived,
	}
	for _, status := range statuses {
		if !validStatus(status) {
			t.Fatalf("expected status %q to be valid", status)
		}
	}
	if validStatus("unknown") {
		t.Fatal("expected unknown status to be rejected")
	}
}

// TestNormalizeChapterIDsRejectsDuplicateAndUnsafeValues verifies batch fail-closed behavior.
func TestNormalizeChapterIDsRejectsDuplicateAndUnsafeValues(t *testing.T) {
	if _, err := normalizeChapterIDs([]string{"chapter-1", "chapter-1"}); !bizerr.Is(err, CodeReorderMismatch) {
		t.Fatalf("expected duplicate mismatch, got %v", err)
	}
	if _, err := normalizeChapterIDs([]string{"chapter-1' OR TRUE"}); !bizerr.Is(err, CodeReorderMismatch) {
		t.Fatalf("expected unsafe ID mismatch, got %v", err)
	}
	ids, err := normalizeChapterIDs([]string{"chapter-2", "chapter-1"})
	if err != nil || len(ids) != 2 || ids[0] != "chapter-2" {
		t.Fatalf("unexpected normalized ids=%v err=%v", ids, err)
	}
}

// TestSameChapterSetRequiresCompleteVisibleSet verifies missing and extra IDs reject the whole batch.
func TestSameChapterSetRequiresCompleteVisibleSet(t *testing.T) {
	current := []*Item{{ID: "chapter-1"}, {ID: "chapter-2"}}
	if !sameChapterSet(current, []string{"chapter-2", "chapter-1"}) {
		t.Fatal("expected complete reordered set to pass")
	}
	if sameChapterSet(current, []string{"chapter-1"}) {
		t.Fatal("expected missing chapter to fail")
	}
	if sameChapterSet(current, []string{"chapter-1", "chapter-3"}) {
		t.Fatal("expected invisible extra chapter to fail")
	}
}

// TestBuildSortCaseUsesValidatedOrder verifies one bounded update expression is generated.
func TestBuildSortCaseUsesValidatedOrder(t *testing.T) {
	expression := buildSortCase([]string{"chapter-2", "chapter-1"})
	if !strings.Contains(expression, "WHEN 'chapter-2' THEN 1") || !strings.Contains(expression, "WHEN 'chapter-1' THEN 2") {
		t.Fatalf("unexpected CASE expression %q", expression)
	}
}
