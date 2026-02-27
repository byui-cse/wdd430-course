<script>
  import { supabase } from "../../lib/supabase.ts";

  const params = new URLSearchParams(window.location.search);
  const projectId = params.get("project");

  let project = $state(null);
  let loading = $state(true);
  let isSubmitting = $state(false);
  let error = $state("");

  let reviewerName = $state("");
  let uxRating = $state(3);
  let uiRating = $state(3);
  let usabilityRating = $state(3);
  let bugsFound = $state("");
  let likes = $state("");
  let dislikes = $state("");
  let suggestions = $state("");
  let additionalNotes = $state("");

  $effect(() => {
    async function loadProject() {
      if (!projectId) {
        error = "Missing project id in URL.";
        loading = false;
        return;
      }

      try {
        const [
          { data: projectData, error: projectError },
          { data: teamsData, error: teamsError }
        ] = await Promise.all([
          supabase
            .from("projects")
            .select("id, name, description, team_id, live_demo_url")
            .eq("id", projectId)
            .single(),
          supabase.from("peer_review_teams").select("id, team_name")
        ]);

        if (projectError) throw projectError;
        if (teamsError) throw teamsError;

        const teamById = new Map(
          (teamsData || []).map((team) => [team.id, team])
        );
        project = {
          ...projectData,
          team_name: teamById.get(projectData.team_id)?.team_name || null
        };

        if (!project.team_id) {
          error = "This project does not have a team attached yet.";
        }
      } catch (err) {
        console.error("Error loading project review form:", err);
        error = err.message || "Failed to load project for peer review.";
      } finally {
        loading = false;
      }
    }

    loadProject();
  });

  async function handleSubmit(event) {
    event.preventDefault();
    error = "";

    if (!project?.team_id) {
      error = "A team must be attached to this project before reviewing.";
      return;
    }

    if (!reviewerName.trim()) {
      error = "Reviewer name is required.";
      return;
    }

    if (!likes.trim() || !dislikes.trim() || !suggestions.trim()) {
      error = "Please complete likes, dislikes, and suggestions.";
      return;
    }

    isSubmitting = true;

    try {
      const { error: insertError } = await supabase
        .from("project_peer_reviews")
        .insert([
          {
            project_id: project.id,
            team_id: project.team_id,
            reviewer_name: reviewerName.trim(),
            ux_rating: Number(uxRating),
            ui_rating: Number(uiRating),
            usability_rating: Number(usabilityRating),
            bugs_found: bugsFound.trim() || null,
            likes: likes.trim(),
            dislikes: dislikes.trim(),
            suggestions: suggestions.trim(),
            additional_notes: additionalNotes.trim() || null
          }
        ]);

      if (insertError) throw insertError;

      window.location.href = "/peer-review/";
    } catch (err) {
      console.error("Error saving project peer review:", err);
      error = err.message || "Failed to save review.";
      isSubmitting = false;
    }
  }
</script>

<div class="review-container">
  {#if loading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading project...</p>
    </div>
  {:else if error && !project}
    <div class="error-banner">⚠️ {error}</div>
  {:else if project}
    <nav class="breadcrumb">
      <a href="/peer-review/">Project Queue</a>
      <span class="separator">/</span>
      <span class="current">{project.name}</span>
    </nav>

    <div class="header">
      <h2>Project Peer Review</h2>
      <p>
        <strong>{project.name}</strong>
        {#if project.team_name}
          · Team: {project.team_name}
        {/if}
      </p>
      {#if project.live_demo_url}
        <p class="demo-link">
          <a href={project.live_demo_url} target="_blank" rel="noreferrer"
            >Open Live Demo</a
          >
        </p>
      {/if}
    </div>

    <form onsubmit={handleSubmit}>
      <div class="form-group">
        <label for="reviewer-name">Reviewer Name</label>
        <input
          id="reviewer-name"
          type="text"
          bind:value={reviewerName}
          required
          disabled={isSubmitting}
          placeholder="Your full name"
        />
      </div>

      <div class="three-col">
        <div class="form-group">
          <label for="ux-rating">How was the UX flow? (1-5)</label>
          <input
            id="ux-rating"
            type="number"
            min="1"
            max="5"
            bind:value={uxRating}
            disabled={isSubmitting}
          />
        </div>

        <div class="form-group">
          <label for="ui-rating">How was the UI quality? (1-5)</label>
          <input
            id="ui-rating"
            type="number"
            min="1"
            max="5"
            bind:value={uiRating}
            disabled={isSubmitting}
          />
        </div>

        <div class="form-group">
          <label for="usability-rating">How usable was it overall? (1-5)</label>
          <input
            id="usability-rating"
            type="number"
            min="1"
            max="5"
            bind:value={usabilityRating}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div class="form-group">
        <label for="bugs-found"
          >Any bugs or broken functionality discovered?</label
        >
        <textarea
          id="bugs-found"
          rows="3"
          bind:value={bugsFound}
          disabled={isSubmitting}
          placeholder="List bugs, error messages, or broken interactions."
        ></textarea>
      </div>

      <div class="form-group">
        <label for="likes">What did you like?</label>
        <textarea
          id="likes"
          rows="3"
          bind:value={likes}
          required
          disabled={isSubmitting}
          placeholder="Share strengths in UX, UI, or functionality."
        ></textarea>
      </div>

      <div class="form-group">
        <label for="dislikes">What did you dislike?</label>
        <textarea
          id="dislikes"
          rows="3"
          bind:value={dislikes}
          required
          disabled={isSubmitting}
          placeholder="Call out friction points or confusing areas."
        ></textarea>
      </div>

      <div class="form-group">
        <label for="suggestions">What suggestions would improve the app?</label>
        <textarea
          id="suggestions"
          rows="3"
          bind:value={suggestions}
          required
          disabled={isSubmitting}
          placeholder="Provide practical next steps for the team."
        ></textarea>
      </div>

      <div class="form-group">
        <label for="additional-notes">Additional notes (optional)</label>
        <textarea
          id="additional-notes"
          rows="3"
          bind:value={additionalNotes}
          disabled={isSubmitting}
          placeholder="Anything else the team should know."
        ></textarea>
      </div>

      {#if error}
        <div class="error-banner">⚠️ {error}</div>
      {/if}

      <div class="actions">
        <a href="/peer-review/" class="cancel-link">Back to Queue</a>
        <button type="submit" class="submit-btn" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </button>
      </div>
    </form>
  {/if}
</div>

<style>
  .review-container {
    max-width: 48rem;
    margin: 3rem auto;
    padding: 2rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    background: white;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08);
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
    margin-bottom: 1.25rem;
  }
  .header h2 {
    margin: 0 0 0.45rem;
    color: #111827;
    font-size: 1.75rem;
  }
  .header p {
    margin: 0.25rem 0;
    color: #4b5563;
  }
  .demo-link a {
    color: #4f46e5;
    text-decoration: none;
    font-weight: 700;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .three-col {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  @media (min-width: 860px) {
    .three-col {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  label {
    font-size: 0.9rem;
    color: #374151;
    font-weight: 700;
  }
  input,
  textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    padding: 0.7rem 0.75rem;
    font-size: 0.95rem;
  }
  input:focus,
  textarea:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 0.75rem;
    border-top: 1px solid #f3f4f6;
    padding-top: 1rem;
  }
  .cancel-link {
    color: #6b7280;
    text-decoration: none;
    border-radius: 0.5rem;
    padding: 0.55rem 0.8rem;
  }
  .cancel-link:hover {
    background: #f3f4f6;
  }
  .submit-btn {
    border: none;
    border-radius: 0.5rem;
    background-color: #4f46e5;
    color: white;
    font-weight: 700;
    padding: 0.75rem 1.2rem;
    cursor: pointer;
  }
  .submit-btn:hover {
    background-color: #4338ca;
  }
  .submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  .loading-state {
    text-align: center;
    color: #6b7280;
    padding: 2rem;
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
    background: #fef2f2;
    color: #b91c1c;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
