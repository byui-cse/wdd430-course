<script>
  import { supabase } from "../../lib/supabase.ts";
  import {
    getSemesterOptions,
    getStoredSemesterCode
  } from "../../lib/semester.ts";
  /**
   * @typedef {Object} Props
   * @property {import('@supabase/supabase-js').SupabaseClient} supabase
   */

  /** @type {Props} */

  let name = $state("");
  let description = $state("");
  let semesterCode = $state(getStoredSemesterCode());
  let semesterOptions = getSemesterOptions();
  let teamId = $state("");
  let liveDemoUrl = $state("");
  let teams = $state([]);
  let isSubmitting = $state(false);
  let error = $state("");

  $effect(() => {
    async function loadTeams() {
      const { data, error: queryError } = await supabase
        .from("peer_review_teams")
        .select("id, team_name")
        .eq("semester_code", semesterCode)
        .order("team_name", { ascending: true });

      if (queryError) {
        console.error("Error loading teams:", queryError);
        return;
      }

      teams = data || [];
    }

    loadTeams();
  });

  async function handleSubmit(e) {
    e.preventDefault();
    isSubmitting = true;
    error = "";

    try {
      // 1. Insert the new project
      const { data, error: insertError } = await supabase
        .from("projects")
        .insert([
          {
            name,
            description,
            semester_code: semesterCode,
            team_id: teamId || null,
            live_demo_url: liveDemoUrl.trim() || null
          }
        ])
        .select("*")
        .single();

      if (insertError) throw insertError;

      // 2. Redirect to the new project page
      // Note: In SvelteKit, use `goto`. If purely client-side router, use window.location
      window.location.href = `/bakeoff/project/?id=${data.id}`;
    } catch (err) {
      console.error("Error creating project:", err);
      error = err.message || "Failed to create project.";
      isSubmitting = false;
    }
  }
</script>

<div class="form-container">
  <div class="header">
    <h2>Create New Project</h2>
    <p>Define the goals for your new technology bakeoff.</p>
  </div>

  <form onsubmit={handleSubmit}>
    <div class="form-group">
      <label for="name">Project Name</label>
      <input
        type="text"
        id="name"
        bind:value={name}
        required
        placeholder="e.g. E-commerce Checkout Rewrite"
        disabled={isSubmitting}
      />
    </div>

    <div class="form-group">
      <label for="description">Description & Goals</label>
      <textarea
        id="description"
        bind:value={description}
        rows="4"
        placeholder="What are the key requirements? (e.g. Must support SEO, High interactivity...)"
        disabled={isSubmitting}
      ></textarea>
    </div>

    <div class="form-group">
      <label for="semester">Semester</label>
      <select id="semester" bind:value={semesterCode} disabled={isSubmitting}>
        {#each semesterOptions as option (option.code)}
          <option value={option.code}>{option.code}</option>
        {/each}
      </select>
    </div>

    <div class="form-group">
      <label for="live-demo-url">Live Demo URL</label>
      <input
        type="url"
        id="live-demo-url"
        bind:value={liveDemoUrl}
        placeholder="https://example.com"
        disabled={isSubmitting}
      />
    </div>

    <div class="form-group">
      <label for="team">Peer Review Team</label>
      <select id="team" bind:value={teamId} disabled={isSubmitting}>
        <option value="">No team attached yet</option>
        {#each teams as team (team.id)}
          <option value={team.id}>{team.team_name}</option>
        {/each}
      </select>
    </div>

    {#if error}
      <div class="error-banner">
        <span>⚠️</span>
        {error}
      </div>
    {/if}

    <div class="actions">
      <a href="/" class="cancel-link">Cancel</a>
      <button type="submit" disabled={isSubmitting} class="submit-btn">
        {#if isSubmitting}
          <span class="spinner"></span> Creating...
        {:else}
          Create Project
        {/if}
      </button>
    </div>
  </form>
</div>

<style>
  /* --- Layout & Container --- */
  .form-container {
    max-width: 40rem; /* Narrower than scorecard for focus */
    margin: 4rem auto;
    padding: 2rem;
    background-color: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
    color: #1f2937;
  }

  .header {
    margin-bottom: 2rem;
    text-align: center;
  }
  .header h2 {
    font-size: 1.75rem;
    font-weight: 800;
    color: #111827;
    margin: 0 0 0.5rem 0;
  }
  .header p {
    color: #6b7280;
    margin: 0;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  /* --- Inputs --- */
  .form-group {
    display: flex;
    flex-direction: column;
  }

  label {
    font-size: 0.875rem;
    font-weight: 700;
    color: #374151;
    margin-bottom: 0.35rem;
  }

  input,
  select,
  textarea {
    display: block;
    width: 100%;
    border-radius: 0.375rem;
    border: 1px solid #d1d5db;
    padding: 0.75rem;
    font-size: 1rem;
    box-sizing: border-box;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
  }

  input:focus,
  select:focus,
  textarea:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }

  input:disabled,
  select:disabled,
  textarea:disabled {
    background-color: #f3f4f6;
    cursor: not-allowed;
  }

  /* --- Actions --- */
  .actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;
    padding-top: 1.5rem;
    border-top: 1px solid #f3f4f6;
  }

  .cancel-link {
    color: #6b7280;
    text-decoration: none;
    font-weight: 500;
    font-size: 0.95rem;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    transition: background-color 0.2s;
  }
  .cancel-link:hover {
    background-color: #f3f4f6;
    color: #374151;
  }

  .submit-btn {
    background-color: #4f46e5;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 700;
    border-radius: 0.5rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    transition: background-color 0.2s;
  }

  .submit-btn:hover {
    background-color: #4338ca;
  }

  .submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  /* --- Feedback --- */
  .error-banner {
    padding: 0.75rem;
    background-color: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
    border-radius: 0.375rem;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
