<script>
  import { supabase } from "../../lib/supabase.ts";
  import {
    getSemesterOptions,
    getStoredSemesterCode,
    storeSemesterCode
  } from "../../lib/semester.ts";

  let projects = $state([]);
  let semesterOptions = getSemesterOptions();
  let selectedSemester = $state(getStoredSemesterCode());
  let loading = $state(true);
  let error = $state("");
  let showOnlyNeedsFollowUp = $state(false);

  let needsFollowUpTotal = $derived.by(() =>
    projects.reduce(
      (sum, project) => sum + Number(project.needsFollowUpCount || 0),
      0
    )
  );

  let visibleProjects = $derived.by(() =>
    showOnlyNeedsFollowUp
      ? projects.filter(
          (project) => Number(project.needsFollowUpCount || 0) > 0
        )
      : projects
  );

  $effect(() => {
    async function loadProjectQueue() {
      try {
        const [
          { data: projectData, error: projectError },
          { data: teamData, error: teamError },
          { data: reviewData, error: reviewError }
        ] = await Promise.all([
          supabase
            .from("projects")
            .select(
              "id, name, description, created_at, team_id, live_demo_url, semester_code"
            )
            .not("team_id", "is", null)
            .eq("semester_code", selectedSemester)
            .order("created_at", { ascending: false }),
          supabase
            .from("peer_review_teams")
            .select("id, team_name, semester_code")
            .eq("semester_code", selectedSemester)
            .order("team_name", { ascending: true }),
          supabase
            .from("project_peer_reviews")
            .select("project_id, created_at, reviewed_by_team")
            .order("created_at", { ascending: false })
        ]);

        if (projectError) throw projectError;
        if (teamError) throw teamError;
        if (reviewError) throw reviewError;

        const teamById = new Map(
          (teamData || []).map((team) => [team.id, team])
        );
        const reviewStats = new Map();

        for (const review of reviewData || []) {
          const current = reviewStats.get(review.project_id) || {
            reviewCount: 0,
            lastReviewAt: null,
            needsFollowUpCount: 0
          };

          current.reviewCount += 1;
          if (!review.reviewed_by_team) {
            current.needsFollowUpCount += 1;
          }
          if (
            !current.lastReviewAt ||
            review.created_at > current.lastReviewAt
          ) {
            current.lastReviewAt = review.created_at;
          }

          reviewStats.set(review.project_id, current);
        }

        const queue = (projectData || []).map((project) => {
          const stats = reviewStats.get(project.id) || {
            reviewCount: 0,
            lastReviewAt: null,
            needsFollowUpCount: 0
          };

          return {
            ...project,
            teamName:
              teamById.get(project.team_id)?.team_name || "Unknown Team",
            reviewCount: stats.reviewCount,
            lastReviewAt: stats.lastReviewAt,
            needsFollowUpCount: stats.needsFollowUpCount
          };
        });

        queue.sort((a, b) => {
          if (a.reviewCount !== b.reviewCount)
            return a.reviewCount - b.reviewCount;
          const aDate = a.lastReviewAt ? new Date(a.lastReviewAt).getTime() : 0;
          const bDate = b.lastReviewAt ? new Date(b.lastReviewAt).getTime() : 0;
          return aDate - bDate;
        });

        projects = queue;
      } catch (err) {
        console.error("Error loading project review queue:", err);
        error = err.message || "Failed to load projects for review.";
      } finally {
        loading = false;
      }
    }

    loadProjectQueue();
  });

  function handleSemesterChange(event) {
    selectedSemester = event.currentTarget.value;
    storeSemesterCode(selectedSemester);
  }

  function formatDate(dateString) {
    if (!dateString) return "No reviews yet";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }
</script>

<div class="list-container">
  <div class="header-row">
    <div>
      <h2>Project Review Queue</h2>
      <p>
        Projects with attached teams, sorted by fewest reviews and oldest recent
        review.
      </p>
    </div>
    <div class="header-actions">
      <div class="semester-picker">
        <label for="project-review-semester">Semester</label>
        <select
          id="project-review-semester"
          value={selectedSemester}
          onchange={handleSemesterChange}
        >
          {#each semesterOptions as option (option.code)}
            <option value={option.code}>{option.code}</option>
          {/each}
        </select>
      </div>
      <a href="/peer-review/teams" class="secondary-link">Manage Teams</a>
    </div>
  </div>

  <div class="follow-up-summary">
    Needs Team Follow-Up: <strong>{needsFollowUpTotal}</strong>
  </div>

  <label class="follow-up-filter">
    <input type="checkbox" bind:checked={showOnlyNeedsFollowUp} />
    Only show projects that need team follow-up
  </label>

  {#if loading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading project queue...</p>
    </div>
  {:else if error}
    <div class="error-banner">⚠️ {error}</div>
  {:else if visibleProjects.length === 0}
    <div class="empty-state">
      <div class="empty-icon">📭</div>
      {#if projects.length === 0}
        <h3>No projects are ready for peer review</h3>
        <p>Attach a team to a project from the bakeoff project details page.</p>
        <a href="/bakeoff" class="primary-link">Go to Bakeoffs</a>
      {:else}
        <h3>No projects need team follow-up</h3>
        <p>
          All reviews in this semester are already marked as reviewed by the
          team.
        </p>
      {/if}
    </div>
  {:else}
    <div class="grid-layout">
      {#each visibleProjects as project (project.id)}
        <article class="project-card">
          <div class="card-top">
            <h3>{project.name}</h3>
            <span class="badge">{project.reviewCount} reviews</span>
          </div>
          <p class="meta">Team: {project.teamName}</p>
          <p class="meta">Last review: {formatDate(project.lastReviewAt)}</p>
          <p class="meta warning">
            Needs Team Follow-Up: {project.needsFollowUpCount}
          </p>
          <p class="description">
            {project.description || "No description provided."}
          </p>
          {#if project.live_demo_url}
            <p class="demo">Live demo attached</p>
          {/if}
          <div class="card-footer">
            <a
              href={`/peer-review/project/?project=${project.id}`}
              class="action-link"
            >
              New Review
            </a>
            <a
              href={`/peer-review/project-reviews/?project=${project.id}`}
              class="action-link secondary"
            >
              See Reviews
            </a>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</div>

<style>
  .list-container {
    max-width: 64rem;
    margin: 0 auto;
    padding: 2rem;
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
    color: #1f2937;
  }
  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 1rem;
    margin-bottom: 1.75rem;
    border-bottom: 1px solid #f3f4f6;
    padding-bottom: 1rem;
  }
  .header-actions {
    display: flex;
    align-items: end;
    gap: 0.75rem;
  }
  .semester-picker {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .semester-picker label {
    font-size: 0.75rem;
    color: #6b7280;
    font-weight: 700;
  }
  .semester-picker select {
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    padding: 0.45rem 0.55rem;
    font-size: 0.85rem;
    color: #374151;
    background: #fff;
  }
  .header-row h2 {
    margin: 0 0 0.4rem;
    font-size: 1.875rem;
    color: #111827;
  }
  .header-row p {
    margin: 0;
    color: #6b7280;
  }
  .follow-up-summary {
    margin: 0 0 1rem;
    padding: 0.7rem 0.85rem;
    border: 1px solid #fde68a;
    border-radius: 0.6rem;
    background: #fffbeb;
    color: #92400e;
    font-weight: 600;
    font-size: 0.92rem;
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
  .secondary-link,
  .primary-link {
    text-decoration: none;
    border-radius: 0.5rem;
    font-weight: 700;
  }
  .secondary-link {
    color: #4f46e5;
    border: 1px solid #c7d2fe;
    padding: 0.5rem 0.85rem;
    background: #eef2ff;
  }
  .primary-link {
    background: #4f46e5;
    color: white;
    padding: 0.65rem 1.1rem;
    display: inline-block;
  }
  .grid-layout {
    display: grid;
    gap: 1rem;
    grid-template-columns: 1fr;
  }
  @media (min-width: 768px) {
    .grid-layout {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  .project-card {
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    background: white;
    color: inherit;
    padding: 1.1rem;
    transition:
      transform 0.2s,
      box-shadow 0.2s,
      border-color 0.2s;
  }
  .project-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    border-color: #c7d2fe;
  }
  .card-top {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }
  .card-top h3 {
    margin: 0;
    color: #111827;
    font-size: 1.1rem;
  }
  .badge {
    background: #eef2ff;
    color: #3730a3;
    border-radius: 9999px;
    font-size: 0.72rem;
    font-weight: 700;
    white-space: nowrap;
    padding: 0.2rem 0.6rem;
    height: fit-content;
  }
  .meta {
    margin: 0 0 0.35rem;
    color: #4b5563;
    font-size: 0.88rem;
  }
  .meta.warning {
    color: #b45309;
    font-weight: 700;
  }
  .description {
    margin: 0.8rem 0;
    color: #6b7280;
    font-size: 0.9rem;
    line-height: 1.45;
  }
  .demo {
    margin: 0;
    color: #047857;
    font-size: 0.83rem;
    font-weight: 600;
  }
  .card-footer {
    margin-top: 0.85rem;
    padding-top: 0.75rem;
    border-top: 1px solid #f3f4f6;
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .action-link {
    text-decoration: none;
    font-size: 0.82rem;
    font-weight: 700;
    padding: 0.4rem 0.65rem;
    border-radius: 0.45rem;
    color: #4f46e5;
    border: 1px solid #c7d2fe;
    background: #eef2ff;
  }
  .action-link.secondary {
    color: #374151;
    border: 1px solid #d1d5db;
    background: #f9fafb;
  }
  .loading-state,
  .empty-state {
    text-align: center;
    padding: 3rem 2rem;
    color: #6b7280;
  }
  .empty-state {
    border: 2px dashed #e5e7eb;
    border-radius: 1rem;
    background: #f9fafb;
  }
  .empty-icon {
    font-size: 2.5rem;
    margin-bottom: 0.75rem;
    opacity: 0.6;
  }
  .error-banner {
    padding: 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid #fecaca;
    color: #b91c1c;
    background: #fef2f2;
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
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
