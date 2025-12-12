<script>
  import { supabase } from "../../lib/supabase.ts";
  /**
   * @typedef {Object} Project
   * @property {string} id
   * @property {string} name
   * @property {string} description
   * @property {string} created_at
   */

  /**
   * @typedef {Object} ScorecardSummary
   * @property {string} id
   * @property {string} stack_name
   * @property {string} scorable_by
   * @property {string} date_scored
   * @property {number} final_score_snapshot
   */

  /**
   * @typedef {Object} Props
   * @property {string} projectId
   * @property {import('@supabase/supabase-js').SupabaseClient} supabase
   */

  /** @type {Props} */
  //   let { projectId, supabase } = $props();
  let params = window.location.search;
  let urlParams = new URLSearchParams(params);
  let projectId = urlParams.get("id");

  /** @type {Project | null} */
  let project = $state(null);
  /** @type {ScorecardSummary[]} */
  let scorecards = $state([]);
  let loading = $state(true);
  let error = $state("");

  // Fetch Data on Mount
  $effect(() => {
    async function loadData() {
      try {
        // 1. Fetch Project Details
        const { data: projData, error: projError } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .single();

        if (projError) throw projError;
        project = projData;

        // 2. Fetch Scorecards (Ordered by Highest Score)
        const { data: scoreData, error: scoreError } = await supabase
          .from("scorecards")
          .select(
            "id, stack_name, scorable_by, date_scored, final_score_snapshot"
          )
          .eq("project_id", projectId)
          .order("final_score_snapshot", { ascending: false });

        if (scoreError) throw scoreError;
        scorecards = scoreData || [];
      } catch (err) {
        console.error("Error loading project details:", err);
        error = "Failed to load project details.";
      } finally {
        loading = false;
      }
    }
    if (projectId) loadData();
  });

  function formatDate(dateString) {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  // Helper to determine color class based on score
  function getScoreColor(score) {
    if (score >= 90) return "score-excellent";
    if (score >= 70) return "score-good";
    if (score >= 50) return "score-average";
    return "score-poor";
  }
</script>

<div class="details-container">
  {#if loading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading project data...</p>
    </div>
  {:else if error}
    <div class="error-banner">
      <span>⚠️</span>
      {error}
      <a href="/" class="back-link">Return to List</a>
    </div>
  {:else if project}
    <nav class="breadcrumb">
      <a href="/">Projects</a>
      <span class="separator">/</span>
      <span class="current">{project.name}</span>
    </nav>

    <div class="project-header">
      <div>
        <h1>{project.name}</h1>
        <p class="description">
          {project.description || "No description available."}
        </p>
      </div>
      <div class="actions">
        <a
          href={`/bakeoff/scorecard/?project=${projectId}`}
          class="primary-btn"
        >
          <span class="icon">+</span> Evaluate New Stack
        </a>
      </div>
    </div>

    <div class="results-section">
      <div class="section-header">
        <h2>Bakeoff Results</h2>
        <span class="count-badge">{scorecards.length} Stacks Evaluated</span>
      </div>

      {#if scorecards.length === 0}
        <div class="empty-results">
          <div class="icon">📊</div>
          <p>No evaluations yet. Start the bakeoff!</p>
        </div>
      {:else}
        <div class="cards-grid">
          {#each scorecards as card, index (card.id)}
            <a
              href={`/bakeoff/scorecard/?project=${projectId}&scorecard=${card.id}`}
              class="result-card"
            >
              {#if index === 0}
                <div class="trophy-badge" title="Current Leader">🏆 Leader</div>
              {/if}

              <div class="card-top">
                <h3 class="stack-name">{card.stack_name}</h3>
                <div
                  class={`score-badge ${getScoreColor(card.final_score_snapshot)}`}
                >
                  {card.final_score_snapshot.toFixed(1)}
                </div>
              </div>

              <div class="card-meta">
                <div class="meta-item">
                  <span class="label">Scored By</span>
                  <span class="value">{card.scorable_by}</span>
                </div>
                <div class="meta-item">
                  <span class="label">Date</span>
                  <span class="value">{formatDate(card.date_scored)}</span>
                </div>
              </div>

              <div class="card-footer">View Full Report &rarr;</div>
            </a>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  /* --- Layout --- */
  .details-container {
    max-width: 64rem;
    min-height: 50vh;
    margin: 0 auto;
    padding: 2rem;
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
    color: #1f2937;
  }

  /* --- Breadcrumb --- */
  .breadcrumb {
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 1.5rem;
  }
  .breadcrumb a {
    color: #4f46e5;
    text-decoration: none;
    font-weight: 500;
  }
  .breadcrumb a:hover {
    text-decoration: underline;
  }
  .separator {
    margin: 0 0.5rem;
    color: #d1d5db;
  }
  .current {
    color: #1f2937;
    font-weight: 600;
  }

  /* --- Header --- */
  .project-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 2rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .project-header h1 {
    font-size: 2.25rem;
    font-weight: 800;
    color: #111827;
    margin: 0 0 0.5rem 0;
    line-height: 1.1;
  }
  .description {
    font-size: 1rem;
    color: #4b5563;
    max-width: 40rem;
    margin: 0;
    line-height: 1.6;
  }

  .primary-btn {
    background-color: #4f46e5;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    text-decoration: none;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    transition: background-color 0.2s;
    white-space: nowrap;
  }
  .primary-btn:hover {
    background-color: #4338ca;
  }
  .icon {
    font-size: 1.2rem;
    line-height: 1;
    font-weight: 400;
  }

  /* --- Results Section --- */
  .section-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  .section-header h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
    color: #111827;
  }
  .count-badge {
    background-color: #f3f4f6;
    color: #4b5563;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
  }

  .empty-results {
    text-align: center;
    padding: 3rem;
    background-color: #f9fafb;
    border-radius: 0.75rem;
    border: 2px dashed #e5e7eb;
    color: #9ca3af;
  }
  .empty-results .icon {
    font-size: 2rem;
    display: block;
    margin-bottom: 0.5rem;
    opacity: 0.5;
  }

  /* --- Grid & Cards --- */
  .cards-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  @media (min-width: 768px) {
    .cards-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (min-width: 1024px) {
    .cards-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .result-card {
    position: relative;
    display: flex;
    flex-direction: column;
    background-color: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 1.5rem;
    text-decoration: none;
    color: inherit;
    transition: all 0.2s;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
  .result-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    border-color: #a5b4fc;
  }

  .trophy-badge {
    position: absolute;
    top: -0.75rem;
    left: 1.5rem;
    background-color: #f59e0b; /* Amber 500 */
    color: white;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-top: 0.5rem;
  }
  .stack-name {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
    color: #111827;
  }

  .score-badge {
    font-size: 1.25rem;
    font-weight: 800;
    padding: 0.25rem 0.5rem;
    border-radius: 0.5rem;
    font-variant-numeric: tabular-nums;
  }
  /* Score Colors */
  .score-excellent {
    background-color: #ecfdf5;
    color: #059669;
  } /* Green */
  .score-good {
    background-color: #eff6ff;
    color: #2563eb;
  } /* Blue */
  .score-average {
    background-color: #fffbeb;
    color: #d97706;
  } /* Yellow */
  .score-poor {
    background-color: #fef2f2;
    color: #dc2626;
  } /* Red */

  .card-meta {
    margin-bottom: 1.5rem;
    font-size: 0.875rem;
  }
  .meta-item {
    display: flex;
    justify-content: space-between;
    padding: 0.25rem 0;
    border-bottom: 1px solid #f3f4f6;
  }
  .meta-item:last-child {
    border-bottom: none;
  }
  .label {
    color: #6b7280;
  }
  .value {
    font-weight: 500;
    color: #374151;
  }

  .card-footer {
    margin-top: auto;
    text-align: center;
    font-size: 0.875rem;
    font-weight: 600;
    color: #4f46e5;
    padding-top: 1rem;
    border-top: 1px solid #f3f4f6;
  }
  .result-card:hover .card-footer {
    text-decoration: underline;
  }

  /* --- Loading/Error --- */
  .loading-state {
    padding: 4rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #9ca3af;
  }
  .spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid #e5e7eb;
    border-top-color: #4f46e5;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .error-banner {
    padding: 1rem;
    background-color: #fef2f2;
    color: #b91c1c;
    border-radius: 0.5rem;
  }
  .back-link {
    margin-left: 1rem;
    color: #b91c1c;
    font-weight: 600;
  }
</style>
