<script>
  import { supabase } from "../../lib/supabase.ts";

  const params = new URLSearchParams(window.location.search);
  const projectId = params.get("project");

  let project = $state(null);
  let reviews = $state([]);
  let loading = $state(true);
  let error = $state("");
  let savingReviewId = $state(null);
  let showOnlyNeedsFollowUp = $state(false);

  let visibleReviews = $derived.by(() =>
    showOnlyNeedsFollowUp
      ? reviews.filter((review) => !review.reviewed_by_team)
      : reviews
  );

  let summary = $derived.by(() => {
    if (!reviews.length) {
      return {
        count: 0,
        needsFollowUpCount: 0,
        avgScore: 0,
        maxScore: 0,
        avgUx: 0,
        maxUx: 0,
        avgUi: 0,
        maxUi: 0,
        avgUsability: 0,
        maxUsability: 0,
        lastReviewAt: null
      };
    }

    const totals = reviews.reduce(
      (acc, review) => {
        acc.ux += Number(review.ux_rating || 0);
        acc.ui += Number(review.ui_rating || 0);
        acc.usability += Number(review.usability_rating || 0);
        return acc;
      },
      { ux: 0, ui: 0, usability: 0 }
    );

    const maxUx = Math.max(
      ...reviews.map((review) => Number(review.ux_rating || 0))
    );
    const maxUi = Math.max(
      ...reviews.map((review) => Number(review.ui_rating || 0))
    );
    const maxUsability = Math.max(
      ...reviews.map((review) => Number(review.usability_rating || 0))
    );

    const perReviewScores = reviews.map((review) => {
      const ux = Number(review.ux_rating || 0);
      const ui = Number(review.ui_rating || 0);
      const usability = Number(review.usability_rating || 0);
      return (ux + ui + usability) / 3;
    });

    const totalScore = perReviewScores.reduce((sum, score) => sum + score, 0);
    const maxScore = Math.max(...perReviewScores);

    return {
      count: reviews.length,
      needsFollowUpCount: reviews.filter((review) => !review.reviewed_by_team)
        .length,
      avgScore: totalScore / reviews.length,
      maxScore,
      avgUx: totals.ux / reviews.length,
      maxUx,
      avgUi: totals.ui / reviews.length,
      maxUi,
      avgUsability: totals.usability / reviews.length,
      maxUsability,
      lastReviewAt: reviews[0]?.created_at || null
    };
  });

  $effect(() => {
    async function loadDetails() {
      if (!projectId) {
        error = "Missing project id in URL.";
        loading = false;
        return;
      }

      try {
        const [
          { data: projectData, error: projectError },
          { data: reviewsData, error: reviewsError },
          { data: teamsData, error: teamsError }
        ] = await Promise.all([
          supabase
            .from("projects")
            .select("id, name, description, team_id, live_demo_url")
            .eq("id", projectId)
            .single(),
          supabase
            .from("project_peer_reviews")
            .select(
              "id, reviewer_name, ux_rating, ui_rating, usability_rating, bugs_found, likes, dislikes, suggestions, additional_notes, created_at, reviewed_by_team, reviewed_at"
            )
            .eq("project_id", projectId)
            .order("created_at", { ascending: false }),
          supabase.from("peer_review_teams").select("id, team_name")
        ]);

        if (projectError) throw projectError;
        if (reviewsError) throw reviewsError;
        if (teamsError) throw teamsError;

        const teamById = new Map(
          (teamsData || []).map((team) => [team.id, team])
        );

        project = {
          ...projectData,
          team_name: teamById.get(projectData.team_id)?.team_name || null
        };
        reviews = reviewsData || [];
      } catch (err) {
        console.error("Error loading project review details:", err);
        error = err.message || "Failed to load project reviews.";
      } finally {
        loading = false;
      }
    }

    loadDetails();
  });

  function formatDate(dateString) {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  async function toggleReviewed(reviewId, checked) {
    savingReviewId = reviewId;
    try {
      const patch = {
        reviewed_by_team: checked,
        reviewed_at: checked ? new Date().toISOString() : null
      };

      const { error: updateError } = await supabase
        .from("project_peer_reviews")
        .update(patch)
        .eq("id", reviewId);

      if (updateError) throw updateError;

      reviews = reviews.map((review) =>
        review.id === reviewId ? { ...review, ...patch } : review
      );
    } catch (err) {
      console.error("Error updating review follow-up status:", err);
      error = err.message || "Failed to update review status.";
    } finally {
      savingReviewId = null;
    }
  }
</script>

<div class="details-container">
  {#if loading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading project reviews...</p>
    </div>
  {:else if error}
    <div class="error-banner">⚠️ {error}</div>
  {:else if project}
    <nav class="breadcrumb">
      <a href="/peer-review/">Project Queue</a>
      <span class="separator">/</span>
      <span class="current">{project.name}</span>
    </nav>

    <div class="header">
      <div>
        <h1>{project.name}</h1>
        <p>
          {#if project.team_name}
            Team: {project.team_name} ·
          {/if}
          {summary.count} reviews submitted
        </p>
      </div>
      <div class="actions">
        <a
          href={`/peer-review/project/?project=${project.id}`}
          class="primary-btn">New Review</a
        >
        {#if project.live_demo_url}
          <a
            href={project.live_demo_url}
            target="_blank"
            rel="noreferrer"
            class="secondary-btn"
          >
            Open Live Demo
          </a>
        {/if}
      </div>
    </div>

    <div class="summary-grid">
      <div class="summary-card">
        <span class="label">Reviews</span>
        <strong>{summary.count}</strong>
      </div>
      <div class="summary-card warning">
        <span class="label">Needs Team Follow-Up</span>
        <strong>{summary.needsFollowUpCount}</strong>
      </div>
      <div class="summary-card">
        <span class="label">UX (Avg/Max)</span>
        <strong>{summary.avgUx.toFixed(2)} / {summary.maxUx.toFixed(2)}</strong>
      </div>
      <div class="summary-card">
        <span class="label">UI (Avg/Max)</span>
        <strong>{summary.avgUi.toFixed(2)} / {summary.maxUi.toFixed(2)}</strong>
      </div>
      <div class="summary-card">
        <span class="label">Usability (Avg/Max)</span>
        <strong
          >{summary.avgUsability.toFixed(2)} / {summary.maxUsability.toFixed(
            2
          )}</strong
        >
      </div>
      <div class="summary-card">
        <span class="label">Score (Avg/Max)</span>
        <strong
          >{summary.avgScore.toFixed(2)} / {summary.maxScore.toFixed(2)}</strong
        >
      </div>
      <div class="summary-card">
        <span class="label">Last Review</span>
        <strong
          >{summary.lastReviewAt
            ? formatDate(summary.lastReviewAt)
            : "None"}</strong
        >
      </div>
    </div>

    <label class="follow-up-filter">
      <input type="checkbox" bind:checked={showOnlyNeedsFollowUp} />
      Only show reviews that need team follow-up
    </label>

    {#if visibleReviews.length === 0}
      <div class="empty-state">
        <div class="icon">📝</div>
        {#if reviews.length === 0}
          <h3>No reviews yet</h3>
          <p>Start by submitting the first peer review for this project.</p>
        {:else}
          <h3>No reviews need follow-up</h3>
          <p>
            All reviews for this project are already marked as reviewed by the
            team.
          </p>
        {/if}
      </div>
    {:else}
      <div class="reviews-list">
        {#each visibleReviews as review (review.id)}
          <article class="review-card">
            <div class="review-status-row">
              <label class="status-toggle">
                <input
                  type="checkbox"
                  checked={!!review.reviewed_by_team}
                  disabled={savingReviewId === review.id}
                  onchange={(event) =>
                    toggleReviewed(review.id, event.currentTarget.checked)}
                />
                Reviewed by team
              </label>
              {#if review.reviewed_by_team && review.reviewed_at}
                <span class="reviewed-at"
                  >Reviewed {formatDate(review.reviewed_at)}</span
                >
              {:else}
                <span class="review-pending">Needs Team Follow-Up</span>
              {/if}
            </div>
            <div class="review-header">
              <strong>{review.reviewer_name}</strong>
              <span>{formatDate(review.created_at)}</span>
            </div>
            <div class="score-row">
              <span>UX: {Number(review.ux_rating).toFixed(1)}</span>
              <span>UI: {Number(review.ui_rating).toFixed(1)}</span>
              <span
                >Usability: {Number(review.usability_rating).toFixed(1)}</span
              >
            </div>
            <p>
              <strong>Bugs/Broken Functionality:</strong>
              {review.bugs_found || "None reported."}
            </p>
            <p><strong>Likes:</strong> {review.likes || "—"}</p>
            <p><strong>Dislikes:</strong> {review.dislikes || "—"}</p>
            <p><strong>Suggestions:</strong> {review.suggestions || "—"}</p>
            {#if review.additional_notes}
              <p>
                <strong>Additional Notes:</strong>
                {review.additional_notes}
              </p>
            {/if}
          </article>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .details-container {
    max-width: 64rem;
    margin: 0 auto;
    padding: 2rem;
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
    color: #1f2937;
  }
  .breadcrumb {
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 1rem;
  }
  .breadcrumb a {
    color: #4f46e5;
    text-decoration: none;
  }
  .separator {
    margin: 0 0.5rem;
    color: #d1d5db;
  }
  .current {
    color: #111827;
    font-weight: 600;
  }
  .header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }
  .header h1 {
    margin: 0 0 0.35rem;
    font-size: 2rem;
    color: #111827;
  }
  .header p {
    margin: 0;
    color: #6b7280;
  }
  .actions {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
  }
  .primary-btn,
  .secondary-btn {
    text-decoration: none;
    border-radius: 0.5rem;
    font-weight: 700;
    padding: 0.65rem 0.9rem;
  }
  .primary-btn {
    background-color: #4f46e5;
    color: white;
  }
  .primary-btn:hover {
    background-color: #4338ca;
  }
  .secondary-btn {
    color: #4f46e5;
    border: 1px solid #c7d2fe;
    background: #eef2ff;
  }
  .summary-grid {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: 1fr;
    margin-bottom: 1rem;
  }
  @media (min-width: 768px) {
    .summary-grid {
      grid-template-columns: repeat(7, 1fr);
    }
  }
  .summary-card {
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 0.75rem;
    background: #fff;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .summary-card .label {
    color: #6b7280;
    font-size: 0.8rem;
    font-weight: 600;
  }
  .summary-card strong {
    color: #111827;
    font-size: 1.05rem;
  }
  .summary-card.warning {
    border-color: #fde68a;
    background: #fffbeb;
  }
  .summary-card.warning strong {
    color: #92400e;
  }
  .follow-up-filter {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 1rem;
    color: #374151;
    font-size: 0.9rem;
    font-weight: 600;
  }
  .follow-up-filter input {
    width: 1rem;
    height: 1rem;
  }
  .reviews-list {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
  }
  .review-card {
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    background: white;
    padding: 1rem;
  }
  .review-status-row {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 0.65rem;
    padding-bottom: 0.65rem;
    border-bottom: 1px solid #f3f4f6;
  }
  .status-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    color: #374151;
    font-weight: 600;
    font-size: 0.88rem;
  }
  .status-toggle input {
    width: 1rem;
    height: 1rem;
  }
  .review-pending {
    color: #b45309;
    font-size: 0.82rem;
    font-weight: 700;
  }
  .reviewed-at {
    color: #047857;
    font-size: 0.82rem;
    font-weight: 700;
  }
  .review-header {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.55rem;
    color: #374151;
  }
  .score-row {
    display: flex;
    gap: 0.9rem;
    flex-wrap: wrap;
    margin-bottom: 0.6rem;
    color: #4b5563;
    font-size: 0.9rem;
    font-weight: 600;
  }
  .review-card p {
    margin: 0.35rem 0;
    line-height: 1.45;
    color: #374151;
  }
  .empty-state {
    text-align: center;
    padding: 3rem 2rem;
    border: 2px dashed #e5e7eb;
    border-radius: 1rem;
    background: #f9fafb;
    color: #6b7280;
  }
  .icon {
    font-size: 2.5rem;
    opacity: 0.6;
    margin-bottom: 0.5rem;
  }
  .loading-state {
    text-align: center;
    color: #6b7280;
    padding: 2.5rem;
  }
  .spinner {
    width: 2rem;
    height: 2rem;
    margin: 0 auto 0.75rem;
    border: 3px solid #e5e7eb;
    border-top-color: #4f46e5;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  .error-banner {
    padding: 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid #fecaca;
    color: #b91c1c;
    background: #fef2f2;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
