<script>
  import { supabase } from "../../lib/supabase.ts";

  const params = new URLSearchParams(window.location.search);
  const teamId = params.get("id");

  let team = $state(null);
  let reviews = $state([]);
  let loading = $state(true);
  let error = $state("");

  const metricKeys = [
    "code_quality",
    "version_control",
    "problem_solving",
    "reliability",
    "communication",
    "teamwork"
  ];

  const metricLabels = {
    code_quality: "Code Quality",
    version_control: "Version Control",
    problem_solving: "Problem Solving",
    reliability: "Reliability",
    communication: "Communication",
    teamwork: "Teamwork"
  };

  $effect(() => {
    async function loadData() {
      if (!teamId) {
        error = "Missing team id in URL.";
        loading = false;
        return;
      }

      try {
        const [
          { data: teamData, error: teamError },
          { data: reviewsData, error: reviewsError }
        ] = await Promise.all([
          supabase
            .from("peer_review_teams")
            .select("id, team_name, members, created_at")
            .eq("id", teamId)
            .single(),
          supabase
            .from("peer_reviews")
            .select("id, reviewer_name, responses, created_at")
            .eq("team_id", teamId)
            .order("created_at", { ascending: false })
        ]);

        if (teamError) throw teamError;
        if (reviewsError) throw reviewsError;

        team = teamData;
        reviews = reviewsData || [];
      } catch (err) {
        console.error("Error loading team details:", err);
        error = err.message || "Failed to load team report.";
      } finally {
        loading = false;
      }
    }

    loadData();
  });

  function computeAverage(values) {
    if (!values.length) return 0;
    const total = values.reduce((sum, value) => sum + Number(value || 0), 0);
    return total / values.length;
  }

  function getModifier(overallAverage) {
    if (overallAverage >= 4.5) return "1.05x (Bonus)";
    if (overallAverage >= 3.5) return "1.0x";
    if (overallAverage >= 2.5) return "0.85x";
    return "0.70x";
  }

  let reportRows = $derived.by(() => {
    const members = Array.isArray(team?.members) ? team.members : [];

    return members.map((memberName) => {
      const entries = [];

      for (const review of reviews) {
        const responses = Array.isArray(review.responses)
          ? review.responses
          : [];
        const match = responses.find(
          (response) =>
            (response?.teammate_name || "").trim().toLowerCase() ===
            memberName.trim().toLowerCase()
        );

        if (match) {
          entries.push({ review, response: match });
        }
      }

      const metricAverages = {};
      for (const key of metricKeys) {
        metricAverages[key] = computeAverage(
          entries.map((entry) => Number(entry.response[key] || 0))
        );
      }

      const overallAverage = computeAverage(Object.values(metricAverages));

      return {
        memberName,
        entries,
        metricAverages,
        overallAverage,
        gradeModifier: getModifier(overallAverage)
      };
    });
  });

  function formatDate(dateString) {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }
</script>

<div class="details-container">
  {#if loading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading peer review report...</p>
    </div>
  {:else if error}
    <div class="error-banner">⚠️ {error}</div>
  {:else if team}
    <nav class="breadcrumb">
      <a href="/peer-review/teams">Teams</a>
      <span class="separator">/</span>
      <span class="current">{team.team_name}</span>
    </nav>

    <div class="header">
      <div>
        <h1>{team.team_name}</h1>
        <p>
          {(team.members || []).length} members · {reviews.length} submitted reviews
        </p>
      </div>
      <a href={`/peer-review/review/?team=${team.id}`} class="primary-btn"
        >Submit Review</a
      >
    </div>

    {#if reviews.length === 0}
      <div class="empty-state">
        <div class="icon">📝</div>
        <h3>No reviews submitted yet</h3>
        <p>
          Share the review link with your team to start collecting peer
          feedback.
        </p>
      </div>
    {:else}
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Teammate</th>
              {#each metricKeys as key}
                <th>{metricLabels[key]}</th>
              {/each}
              <th>Average</th>
              <th>Grade Modifier</th>
            </tr>
          </thead>
          <tbody>
            {#each reportRows as row (row.memberName)}
              <tr>
                <td>
                  <strong>{row.memberName}</strong>
                  <div class="count">{row.entries.length} ratings</div>
                </td>
                {#each metricKeys as key}
                  <td>{row.metricAverages[key].toFixed(2)}</td>
                {/each}
                <td><strong>{row.overallAverage.toFixed(2)}</strong></td>
                <td>{row.gradeModifier}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <div class="responses">
        <h2>Reviewer Notes</h2>
        {#each reportRows as row (row.memberName)}
          <section class="member-notes">
            <h3>{row.memberName}</h3>
            {#if row.entries.length === 0}
              <p class="empty-note">No notes submitted.</p>
            {:else}
              {#each row.entries as entry (entry.review.id + row.memberName)}
                <article class="note-card">
                  <div class="note-header">
                    <strong>{entry.review.reviewer_name}</strong>
                    <span>{formatDate(entry.review.created_at)}</span>
                  </div>
                  <p>
                    <strong>Bus Factor:</strong>
                    {entry.response.bus_factor || "—"}
                  </p>
                  <p>
                    <strong>Specific Example:</strong>
                    {entry.response.specific_example || "—"}
                  </p>
                  <p>
                    <strong>Constructive Advice:</strong>
                    {entry.response.constructive_advice || "—"}
                  </p>
                </article>
              {/each}
            {/if}
          </section>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .details-container {
    max-width: 72rem;
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
  .breadcrumb a:hover {
    text-decoration: underline;
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
    align-items: flex-start;
    gap: 1rem;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 1.25rem;
    margin-bottom: 1.25rem;
    flex-wrap: wrap;
  }
  .header h1 {
    margin: 0 0 0.35rem;
    color: #111827;
    font-size: 2rem;
  }
  .header p {
    margin: 0;
    color: #6b7280;
  }
  .primary-btn {
    background-color: #4f46e5;
    color: white;
    text-decoration: none;
    border-radius: 0.5rem;
    padding: 0.7rem 1.1rem;
    font-weight: 700;
    white-space: nowrap;
  }
  .primary-btn:hover {
    background-color: #4338ca;
  }
  .table-scroll {
    overflow-x: auto;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    background: white;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 780px;
  }
  th,
  td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #f3f4f6;
    font-size: 0.9rem;
  }
  th {
    color: #374151;
    background-color: #f9fafb;
    font-weight: 700;
  }
  .count {
    color: #6b7280;
    font-size: 0.8rem;
    margin-top: 0.2rem;
  }
  .responses {
    margin-top: 1.5rem;
  }
  .responses h2 {
    margin-bottom: 0.75rem;
    font-size: 1.35rem;
  }
  .member-notes {
    margin-bottom: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 1rem;
    background: #fff;
  }
  .member-notes h3 {
    margin: 0 0 0.75rem;
    font-size: 1.1rem;
    color: #111827;
  }
  .note-card {
    border-top: 1px solid #f3f4f6;
    padding-top: 0.75rem;
    margin-top: 0.75rem;
  }
  .note-card p {
    margin: 0.35rem 0;
    line-height: 1.45;
    color: #374151;
  }
  .note-header {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
    color: #6b7280;
    margin-bottom: 0.35rem;
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
  .empty-note {
    color: #6b7280;
    margin: 0;
  }
  .error-banner {
    padding: 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid #fecaca;
    background-color: #fef2f2;
    color: #b91c1c;
  }
  .loading-state {
    text-align: center;
    padding: 3rem;
    color: #6b7280;
  }
  .spinner {
    width: 1.75rem;
    height: 1.75rem;
    border: 3px solid #e5e7eb;
    border-top-color: #4f46e5;
    border-radius: 50%;
    margin: 0 auto 0.75rem;
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
