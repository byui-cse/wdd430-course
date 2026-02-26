<script>
  import { supabase } from "../../lib/supabase.ts";

  let teams = $state([]);
  let loading = $state(true);
  let error = $state("");

  $effect(() => {
    async function fetchTeams() {
      try {
        const { data, error: queryError } = await supabase
          .from("peer_review_teams")
          .select("id, team_name, members, created_at")
          .order("created_at", { ascending: false });

        if (queryError) throw queryError;
        teams = data || [];
      } catch (err) {
        console.error("Error loading peer review teams:", err);
        error = err.message || "Failed to load teams.";
      } finally {
        loading = false;
      }
    }

    fetchTeams();
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

<div class="list-container">
  <div class="header-row">
    <div>
      <h2>Peer Review Teams</h2>
      <p>Create a team, collect reviews, and view contribution reports.</p>
    </div>
    <a href="/peer-review/new" class="add-btn"
      ><span class="plus">+</span> New Team</a
    >
  </div>

  {#if loading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading teams...</p>
    </div>
  {:else if error}
    <div class="error-banner">⚠️ {error}</div>
  {:else if teams.length === 0}
    <div class="empty-state">
      <div class="empty-icon">👥</div>
      <h3>No peer review teams yet</h3>
      <p>Start by creating your team roster.</p>
      <a href="/peer-review/new" class="add-btn-large">Create Team</a>
    </div>
  {:else}
    <div class="grid-layout">
      {#each teams as team (team.id)}
        <a href={`/peer-review/team/?id=${team.id}`} class="team-card">
          <div class="card-top">
            <h3>{team.team_name}</h3>
            <span class="date">{formatDate(team.created_at)}</span>
          </div>
          <p class="meta">
            {Array.isArray(team.members) ? team.members.length : 0} members
          </p>
          <div class="card-footer">Open Team &rarr;</div>
        </a>
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
    margin-bottom: 2rem;
    border-bottom: 1px solid #f3f4f6;
    padding-bottom: 1rem;
    gap: 1rem;
  }
  .header-row h2 {
    font-size: 1.875rem;
    font-weight: 800;
    margin: 0 0 0.5rem 0;
    color: #111827;
  }
  .header-row p {
    margin: 0;
    color: #6b7280;
  }
  .add-btn,
  .add-btn-large {
    background-color: #4f46e5;
    color: white;
    text-decoration: none;
    border-radius: 0.5rem;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
  .add-btn {
    padding: 0.6rem 1.2rem;
    font-size: 0.9rem;
  }
  .add-btn-large {
    padding: 0.75rem 1.5rem;
  }
  .add-btn:hover,
  .add-btn-large:hover {
    background-color: #4338ca;
  }
  .plus {
    font-size: 1.1rem;
    line-height: 1;
  }
  .grid-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
  @media (min-width: 768px) {
    .grid-layout {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  .team-card {
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 1.25rem;
    text-decoration: none;
    color: inherit;
    background: white;
    transition:
      transform 0.2s,
      box-shadow 0.2s,
      border-color 0.2s;
  }
  .team-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    border-color: #c7d2fe;
  }
  .card-top {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }
  .card-top h3 {
    margin: 0;
    font-size: 1.125rem;
    color: #111827;
  }
  .date {
    color: #9ca3af;
    font-size: 0.75rem;
    white-space: nowrap;
  }
  .meta {
    color: #6b7280;
    margin: 0 0 1rem;
  }
  .card-footer {
    text-align: right;
    border-top: 1px solid #f9fafb;
    padding-top: 0.75rem;
    color: #4f46e5;
    font-weight: 600;
    font-size: 0.85rem;
  }
  .loading-state,
  .empty-state {
    text-align: center;
    padding: 3rem 2rem;
    color: #6b7280;
  }
  .empty-state {
    background: #f9fafb;
    border: 2px dashed #e5e7eb;
    border-radius: 1rem;
  }
  .empty-icon {
    font-size: 2.5rem;
    margin-bottom: 0.75rem;
    opacity: 0.6;
  }
  .error-banner {
    padding: 0.75rem;
    background-color: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
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
