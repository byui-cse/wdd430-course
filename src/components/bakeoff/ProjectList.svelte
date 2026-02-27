<script>
  import { supabase } from "../../lib/supabase.ts";
  import {
    getSemesterOptions,
    getStoredSemesterCode,
    storeSemesterCode
  } from "../../lib/semester.ts";

  /**
   * @typedef {Object} Project
   * @property {string} id
   * @property {string} name
   * @property {string} description
   * @property {string} created_at
   */

  /**
   * @typedef {Object} Props
   * @property {import('@supabase/supabase-js').SupabaseClient} supabase
   */

  /** @type {Props} */

  /** @type {Project[]} */
  let projects = $state([]);
  let semesterOptions = getSemesterOptions();
  let selectedSemester = $state(getStoredSemesterCode());
  let loading = $state(true);
  let error = $state("");

  // Load projects on mount
  $effect(() => {
    async function fetchProjects() {
      try {
        const { data, error: err } = await supabase
          .from("projects")
          .select("*")
          .eq("semester_code", selectedSemester)
          .order("created_at", { ascending: false });

        if (err) throw err;
        projects = data || [];
      } catch (err) {
        console.error("Error fetching projects:", err);
        error = "Failed to load projects.";
      } finally {
        loading = false;
      }
    }
    fetchProjects();
  });

  function handleSemesterChange(event) {
    selectedSemester = event.currentTarget.value;
    storeSemesterCode(selectedSemester);
  }

  // Simple helper to format dates
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
      <h2>Active Bakeoffs</h2>
      <p>Select a project to view scorecards or start a new comparison.</p>
    </div>
    <div class="header-actions">
      <div class="semester-picker">
        <label for="semester-filter">Semester</label>
        <select
          id="semester-filter"
          value={selectedSemester}
          onchange={handleSemesterChange}
        >
          {#each semesterOptions as option (option.code)}
            <option value={option.code}>{option.code}</option>
          {/each}
        </select>
      </div>
      <a href="/bakeoff/new" class="add-btn">
        <span class="plus">+</span> New Project
      </a>
    </div>
  </div>

  {#if loading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading projects...</p>
    </div>
  {:else if error}
    <div class="error-banner">
      <span>⚠️</span>
      {error}
    </div>
  {:else if projects.length === 0}
    <div class="empty-state">
      <div class="empty-icon">📂</div>
      <h3>No projects found</h3>
      <p>Get started by creating your first bakeoff project.</p>
      <a href="/bakeoff/new" class="add-btn-large">Create Project</a>
    </div>
  {:else}
    <div class="grid-layout">
      {#each projects as project (project.id)}
        <a href={`/bakeoff/project/?id=${project.id}`} class="project-card">
          <div class="card-top">
            <h3>{project.name}</h3>
            <span class="date">{formatDate(project.created_at)}</span>
          </div>
          <p class="description">
            {project.description || "No description provided."}
          </p>
          <div class="card-footer">
            <span class="view-link">View Details &rarr;</span>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>

<style>
  /* --- Container & Layout --- */
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
    font-size: 1.875rem;
    font-weight: 800;
    color: #111827;
    margin: 0 0 0.5rem 0;
  }

  .header-row p {
    margin: 0;
    color: #6b7280;
    font-size: 0.95rem;
  }

  /* --- Buttons --- */
  .add-btn {
    background-color: #4f46e5;
    color: white;
    padding: 0.6rem 1.2rem;
    border-radius: 0.5rem;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9rem;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    transition: background-color 0.2s;
  }

  .add-btn:hover {
    background-color: #4338ca;
  }

  .plus {
    font-size: 1.1rem;
    line-height: 1;
  }

  /* --- Grid & Cards --- */
  .grid-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media (min-width: 768px) {
    .grid-layout {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 1024px) {
    .grid-layout {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .project-card {
    background-color: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 1.5rem;
    text-decoration: none;
    color: inherit;
    display: flex;
    flex-direction: column;
    transition:
      transform 0.2s,
      box-shadow 0.2s,
      border-color 0.2s;
    height: 100%; /* For uniform height in grid */
    box-sizing: border-box;
  }

  .project-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    border-color: #c7d2fe;
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.75rem;
  }

  .card-top h3 {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
    line-height: 1.3;
  }

  .date {
    font-size: 0.75rem;
    color: #9ca3af;
    white-space: nowrap;
    margin-left: 0.5rem;
  }

  .description {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0 0 1.5rem 0;
    flex-grow: 1; /* Pushes footer down */
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-footer {
    padding-top: 1rem;
    border-top: 1px solid #f9fafb;
    text-align: right;
  }

  .view-link {
    font-size: 0.8rem;
    font-weight: 600;
    color: #4f46e5;
  }

  .project-card:hover .view-link {
    text-decoration: underline;
  }

  /* --- States --- */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem;
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
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    background-color: #f9fafb;
    border: 2px dashed #e5e7eb;
    border-radius: 1rem;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .empty-state h3 {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    color: #374151;
  }

  .empty-state p {
    color: #6b7280;
    margin-bottom: 1.5rem;
  }

  .add-btn-large {
    background-color: #4f46e5;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    text-decoration: none;
    font-weight: 600;
    transition: background-color 0.2s;
  }

  .add-btn-large:hover {
    background-color: #4338ca;
  }
</style>
