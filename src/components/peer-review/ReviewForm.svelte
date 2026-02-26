<script>
  import { supabase } from "../../lib/supabase.ts";

  const params = new URLSearchParams(window.location.search);
  const teamId = params.get("team");

  let team = $state(null);
  let loading = $state(true);
  let isSubmitting = $state(false);
  let error = $state("");

  let reviewerName = $state("");
  let includeSelf = $state(false);

  /** @type {Record<string, {
   * code_quality:number,
   * version_control:number,
   * problem_solving:number,
   * reliability:number,
   * communication:number,
   * teamwork:number,
   * bus_factor:string,
   * specific_example:string,
   * constructive_advice:string
   * }>} */
  let responses = $state({});

  const numericKeys = [
    "code_quality",
    "version_control",
    "problem_solving",
    "reliability",
    "communication",
    "teamwork"
  ];

  const ratingHints = {
    code_quality:
      "Think about clean structure, maintainability, and consistency with team standards.",
    version_control:
      "Consider commit quality, branch hygiene, and meaningful participation in code reviews.",
    problem_solving:
      "Rate how proactively they investigate blockers and help move technical issues forward.",
    reliability:
      "Consider whether they deliver promised work on time and finish tasks to completion.",
    communication:
      "Think about status updates, asking for help when stuck, and keeping teammates informed.",
    teamwork:
      "Consider collaboration quality, peer support, and constructive participation in team decisions."
  };

  const writtenHints = {
    bus_factor:
      "Describe what project knowledge or ownership would be lost if they left the team.",
    specific_example:
      "Give one concrete example of how this teammate helped solve a real issue.",
    constructive_advice:
      "Share one actionable suggestion that could improve their technical contribution."
  };

  function normalizeName(name) {
    return (name || "").trim().toLowerCase();
  }

  function slugify(value) {
    return (value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function fieldId(teammateName, fieldKey) {
    return `review-${slugify(teammateName)}-${fieldKey}`;
  }

  function buildDefaultResponse() {
    return {
      code_quality: 3,
      version_control: 3,
      problem_solving: 3,
      reliability: 3,
      communication: 3,
      teamwork: 3,
      bus_factor: "",
      specific_example: "",
      constructive_advice: ""
    };
  }

  let teammatesToReview = $derived.by(() => {
    const members = Array.isArray(team?.members) ? team.members : [];
    if (includeSelf || !reviewerName.trim()) return members;

    const reviewer = normalizeName(reviewerName);
    return members.filter((name) => normalizeName(name) !== reviewer);
  });

  $effect(() => {
    async function loadTeam() {
      if (!teamId) {
        error = "Missing team id in URL.";
        loading = false;
        return;
      }

      try {
        const { data, error: queryError } = await supabase
          .from("peer_review_teams")
          .select("id, team_name, members")
          .eq("id", teamId)
          .single();

        if (queryError) throw queryError;

        team = data;
        const base = {};
        for (const member of data.members || []) {
          base[member] = buildDefaultResponse();
        }
        responses = base;
      } catch (err) {
        console.error("Error loading team:", err);
        error = err.message || "Failed to load team.";
      } finally {
        loading = false;
      }
    }

    loadTeam();
  });

  function setRating(member, key, value) {
    responses = {
      ...responses,
      [member]: {
        ...responses[member],
        [key]: Number(value)
      }
    };
  }

  function setText(member, key, value) {
    responses = {
      ...responses,
      [member]: {
        ...responses[member],
        [key]: value
      }
    };
  }

  function calculateOverallAverage(response) {
    const total = numericKeys.reduce(
      (sum, key) => sum + Number(response[key] || 0),
      0
    );
    return total / numericKeys.length;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    error = "";

    if (!reviewerName.trim()) {
      error = "Reviewer name is required.";
      return;
    }

    if (!teammatesToReview.length) {
      error =
        "No teammates available to review. Toggle 'Include myself' if needed.";
      return;
    }

    for (const teammateName of teammatesToReview) {
      const response = responses[teammateName];
      if (!response) {
        error = `Missing response for ${teammateName}.`;
        return;
      }

      for (const key of numericKeys) {
        const value = Number(response[key]);
        if (Number.isNaN(value) || value < 1 || value > 5) {
          error = `Each score for ${teammateName} must be between 1 and 5.`;
          return;
        }
      }
    }

    isSubmitting = true;

    try {
      const payload = teammatesToReview.map((teammateName) => {
        const response = responses[teammateName];
        return {
          teammate_name: teammateName,
          ...response,
          average_score: Number(calculateOverallAverage(response).toFixed(2))
        };
      });

      const { error: insertError } = await supabase
        .from("peer_reviews")
        .insert([
          {
            team_id: teamId,
            reviewer_name: reviewerName.trim(),
            responses: payload
          }
        ]);

      if (insertError) throw insertError;

      window.location.href = `/peer-review/team/?id=${teamId}`;
    } catch (err) {
      console.error("Error submitting peer review:", err);
      error = err.message || "Failed to save peer review.";
      isSubmitting = false;
    }
  }
</script>

<div class="review-container">
  {#if loading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading team...</p>
    </div>
  {:else if error && !team}
    <div class="error-banner">⚠️ {error}</div>
  {:else if team}
    <div class="header">
      <h2>Peer Review Submission</h2>
      <p><strong>{team.team_name}</strong> · Submit one review per reviewer.</p>
    </div>

    <div class="scale-legend" aria-label="Rating scale guidance">
      <p class="scale-title">Rating Scale</p>
      <p>
        <strong>1</strong> = Poor · <strong>3</strong> = Meets Expectations ·
        <strong>5</strong> = Exceptional
      </p>
    </div>

    <form onsubmit={handleSubmit}>
      <div class="meta-row">
        <div class="form-group">
          <label for="reviewer-name">Reviewer Name</label>
          <input
            id="reviewer-name"
            type="text"
            bind:value={reviewerName}
            placeholder="Your full name"
            required
            disabled={isSubmitting}
          />
        </div>
        <label class="toggle">
          <input
            type="checkbox"
            bind:checked={includeSelf}
            disabled={isSubmitting}
          />
          Include myself in the review list
        </label>
      </div>

      {#if !includeSelf && reviewerName.trim() && teammatesToReview.length !== (team.members?.length || 0)}
        <p class="hint">Your own matching name is excluded automatically.</p>
      {/if}

      {#each teammatesToReview as teammateName (teammateName)}
        {@const response = responses[teammateName]}
        <fieldset class="card">
          <legend>{teammateName}</legend>

          <div class="grid">
            <div class="form-group">
              <label for={fieldId(teammateName, "code_quality")}
                >Code Quality (1-5)</label
              >
              <input
                id={fieldId(teammateName, "code_quality")}
                type="number"
                min="1"
                max="5"
                value={response.code_quality}
                aria-describedby={`${fieldId(teammateName, "code_quality")}-hint`}
                oninput={(e) =>
                  setRating(
                    teammateName,
                    "code_quality",
                    e.currentTarget.value
                  )}
              />
              <p
                class="input-hint"
                id={`${fieldId(teammateName, "code_quality")}-hint`}
              >
                {ratingHints.code_quality}
              </p>
            </div>
            <div class="form-group">
              <label for={fieldId(teammateName, "version_control")}
                >Version Control (1-5)</label
              >
              <input
                id={fieldId(teammateName, "version_control")}
                type="number"
                min="1"
                max="5"
                value={response.version_control}
                aria-describedby={`${fieldId(teammateName, "version_control")}-hint`}
                oninput={(e) =>
                  setRating(
                    teammateName,
                    "version_control",
                    e.currentTarget.value
                  )}
              />
              <p
                class="input-hint"
                id={`${fieldId(teammateName, "version_control")}-hint`}
              >
                {ratingHints.version_control}
              </p>
            </div>
            <div class="form-group">
              <label for={fieldId(teammateName, "problem_solving")}
                >Problem Solving (1-5)</label
              >
              <input
                id={fieldId(teammateName, "problem_solving")}
                type="number"
                min="1"
                max="5"
                value={response.problem_solving}
                aria-describedby={`${fieldId(teammateName, "problem_solving")}-hint`}
                oninput={(e) =>
                  setRating(
                    teammateName,
                    "problem_solving",
                    e.currentTarget.value
                  )}
              />
              <p
                class="input-hint"
                id={`${fieldId(teammateName, "problem_solving")}-hint`}
              >
                {ratingHints.problem_solving}
              </p>
            </div>
            <div class="form-group">
              <label for={fieldId(teammateName, "reliability")}
                >Reliability (1-5)</label
              >
              <input
                id={fieldId(teammateName, "reliability")}
                type="number"
                min="1"
                max="5"
                value={response.reliability}
                aria-describedby={`${fieldId(teammateName, "reliability")}-hint`}
                oninput={(e) =>
                  setRating(teammateName, "reliability", e.currentTarget.value)}
              />
              <p
                class="input-hint"
                id={`${fieldId(teammateName, "reliability")}-hint`}
              >
                {ratingHints.reliability}
              </p>
            </div>
            <div class="form-group">
              <label for={fieldId(teammateName, "communication")}
                >Communication (1-5)</label
              >
              <input
                id={fieldId(teammateName, "communication")}
                type="number"
                min="1"
                max="5"
                value={response.communication}
                aria-describedby={`${fieldId(teammateName, "communication")}-hint`}
                oninput={(e) =>
                  setRating(
                    teammateName,
                    "communication",
                    e.currentTarget.value
                  )}
              />
              <p
                class="input-hint"
                id={`${fieldId(teammateName, "communication")}-hint`}
              >
                {ratingHints.communication}
              </p>
            </div>
            <div class="form-group">
              <label for={fieldId(teammateName, "teamwork")}
                >Teamwork (1-5)</label
              >
              <input
                id={fieldId(teammateName, "teamwork")}
                type="number"
                min="1"
                max="5"
                value={response.teamwork}
                aria-describedby={`${fieldId(teammateName, "teamwork")}-hint`}
                oninput={(e) =>
                  setRating(teammateName, "teamwork", e.currentTarget.value)}
              />
              <p
                class="input-hint"
                id={`${fieldId(teammateName, "teamwork")}-hint`}
              >
                {ratingHints.teamwork}
              </p>
            </div>
          </div>

          <div class="form-group">
            <label for={fieldId(teammateName, "bus_factor")}>Bus Factor</label>
            <textarea
              id={fieldId(teammateName, "bus_factor")}
              rows="2"
              value={response.bus_factor}
              aria-describedby={`${fieldId(teammateName, "bus_factor")}-hint`}
              oninput={(e) =>
                setText(teammateName, "bus_factor", e.currentTarget.value)}
              placeholder="What knowledge would be lost if this person left?"
            ></textarea>
            <p
              class="input-hint"
              id={`${fieldId(teammateName, "bus_factor")}-hint`}
            >
              {writtenHints.bus_factor}
            </p>
          </div>

          <div class="form-group">
            <label for={fieldId(teammateName, "specific_example")}
              >Specific Example</label
            >
            <textarea
              id={fieldId(teammateName, "specific_example")}
              rows="2"
              value={response.specific_example}
              aria-describedby={`${fieldId(teammateName, "specific_example")}-hint`}
              oninput={(e) =>
                setText(
                  teammateName,
                  "specific_example",
                  e.currentTarget.value
                )}
              placeholder="One concrete way they helped the team"
            ></textarea>
            <p
              class="input-hint"
              id={`${fieldId(teammateName, "specific_example")}-hint`}
            >
              {writtenHints.specific_example}
            </p>
          </div>

          <div class="form-group">
            <label for={fieldId(teammateName, "constructive_advice")}
              >Constructive Advice</label
            >
            <textarea
              id={fieldId(teammateName, "constructive_advice")}
              rows="2"
              value={response.constructive_advice}
              aria-describedby={`${fieldId(teammateName, "constructive_advice")}-hint`}
              oninput={(e) =>
                setText(
                  teammateName,
                  "constructive_advice",
                  e.currentTarget.value
                )}
              placeholder="One technical area to improve"
            ></textarea>
            <p
              class="input-hint"
              id={`${fieldId(teammateName, "constructive_advice")}-hint`}
            >
              {writtenHints.constructive_advice}
            </p>
          </div>
        </fieldset>
      {/each}

      {#if error}
        <div class="error-banner">⚠️ {error}</div>
      {/if}

      <div class="actions">
        <a href={`/peer-review/team/?id=${teamId}`} class="cancel-link"
          >Cancel</a
        >
        <button type="submit" class="submit-btn" disabled={isSubmitting}>
          {#if isSubmitting}
            <span class="spinner small"></span> Saving...
          {:else}
            Submit Review
          {/if}
        </button>
      </div>
    </form>
  {/if}
</div>

<style>
  .review-container {
    max-width: 72rem;
    margin: 0 auto;
    padding: 2rem;
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
    color: #1f2937;
  }
  .header {
    margin-bottom: 1.5rem;
  }
  .header h2 {
    margin: 0 0 0.35rem;
    font-size: 1.75rem;
    color: #111827;
  }
  .header p {
    margin: 0;
    color: #6b7280;
  }
  .scale-legend {
    margin-bottom: 1rem;
    padding: 0.75rem 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    background-color: #f9fafb;
  }
  .scale-title {
    margin: 0 0 0.2rem;
    font-size: 0.85rem;
    color: #374151;
    font-weight: 700;
  }
  .scale-legend p {
    margin: 0;
    color: #4b5563;
    font-size: 0.9rem;
    line-height: 1.4;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  .meta-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;

    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    background-color: #f9fafb;
  }
  .toggle {
    font-size: 0.9rem;
    color: #374151;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    & > input {
      width: auto;
    }
  }
  .hint {
    margin: -0.5rem 0 0;
    color: #6b7280;
    font-size: 0.9rem;
  }
  .card {
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 1rem;
    background: white;
  }
  legend {
    padding: 0 0.4rem;
    font-weight: 700;
    color: #111827;
  }
  .grid {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
  @media (min-width: 900px) {
    .grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-bottom: 0.75rem;
  }
  .input-hint {
    margin: 0.1rem 0 0;
    color: #6b7280;
    font-size: 0.8rem;
    line-height: 1.3;
  }
  label {
    font-size: 0.875rem;
    font-weight: 700;
    color: #374151;
  }
  input,
  textarea {
    width: 100%;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    padding: 0.65rem;
    font-size: 0.95rem;
    box-sizing: border-box;
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
    padding-top: 0.75rem;
    border-top: 1px solid #f3f4f6;
  }
  .cancel-link {
    color: #6b7280;
    text-decoration: none;
    padding: 0.5rem 0.75rem;
    border-radius: 0.375rem;
  }
  .cancel-link:hover {
    background-color: #f3f4f6;
  }
  .submit-btn {
    border: none;
    border-radius: 0.5rem;
    background-color: #4f46e5;
    color: white;
    font-weight: 700;
    padding: 0.7rem 1.2rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
  .submit-btn:hover {
    background-color: #4338ca;
  }
  .submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
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
  .spinner.small {
    width: 1rem;
    height: 1rem;
    margin: 0;
    border-width: 2px;
    border-color: rgba(255, 255, 255, 0.35);
    border-top-color: #fff;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
