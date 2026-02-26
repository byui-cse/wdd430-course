<script>
  import { supabase } from "../../lib/supabase.ts";

  let teamName = $state("");
  let membersText = $state("");
  let isSubmitting = $state(false);
  let error = $state("");

  let parsedMembers = $derived.by(() => {
    return membersText
      .split("\n")
      .map((name) => name.trim())
      .filter(Boolean)
      .filter(
        (name, index, arr) =>
          arr.findIndex((n) => n.toLowerCase() === name.toLowerCase()) === index
      );
  });

  async function handleSubmit(event) {
    event.preventDefault();
    error = "";

    if (!teamName.trim()) {
      error = "Team name is required.";
      return;
    }

    if (parsedMembers.length < 2) {
      error = "Please provide at least 2 team members (one per line).";
      return;
    }

    isSubmitting = true;

    try {
      const { data, error: insertError } = await supabase
        .from("peer_review_teams")
        .insert([
          {
            team_name: teamName.trim(),
            members: parsedMembers
          }
        ])
        .select("id")
        .single();

      if (insertError) throw insertError;

      window.location.href = `/peer-review/team/?id=${data.id}`;
    } catch (err) {
      console.error("Error creating peer review team:", err);
      error = err.message || "Failed to create team.";
      isSubmitting = false;
    }
  }
</script>

<div class="form-container">
  <div class="header">
    <h2>Create Peer Review Team</h2>
    <p>Add the full roster. Team size can be any number.</p>
  </div>

  <form onsubmit={handleSubmit}>
    <div class="form-group">
      <label for="team-name">Team Name</label>
      <input
        id="team-name"
        type="text"
        bind:value={teamName}
        required
        disabled={isSubmitting}
        placeholder="e.g. Team Hyperion"
      />
    </div>

    <div class="form-group">
      <label for="members">Team Members (one name per line)</label>
      <textarea
        id="members"
        rows="8"
        bind:value={membersText}
        disabled={isSubmitting}
        placeholder="Alice
Bob
Charlie"
      ></textarea>
      <small>{parsedMembers.length} unique members</small>
    </div>

    {#if error}
      <div class="error-banner">⚠️ {error}</div>
    {/if}

    <div class="actions">
      <a href="/peer-review/" class="cancel-link">Cancel</a>
      <button type="submit" class="submit-btn" disabled={isSubmitting}>
        {#if isSubmitting}
          <span class="spinner"></span> Creating...
        {:else}
          Create Team
        {/if}
      </button>
    </div>
  </form>
</div>

<style>
  .form-container {
    max-width: 44rem;
    margin: 3rem auto;
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
    margin-bottom: 1.5rem;
  }
  .header h2 {
    margin: 0 0 0.5rem;
    color: #111827;
    font-size: 1.75rem;
  }
  .header p {
    margin: 0;
    color: #6b7280;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  label {
    font-size: 0.9rem;
    font-weight: 700;
    color: #374151;
  }
  input,
  textarea {
    width: 100%;
    border-radius: 0.5rem;
    border: 1px solid #d1d5db;
    padding: 0.75rem;
    font-size: 1rem;
    box-sizing: border-box;
  }
  input:focus,
  textarea:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
  small {
    color: #6b7280;
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
    padding: 0.75rem 1.25rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
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
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    color: #b91c1c;
    border-radius: 0.5rem;
  }
  .spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.35);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
