<script lang="ts">
  import type { Activity, ActivityStatus } from "./types";

  export let activities: Activity[] = [];
  export let loading = false;
  export let error = "";
  export let search = "";
  export let selectedStatus = "all";
  export let statusOptions: ActivityStatus[] = [];
  export let noteDrafts: Record<number, string> = {};
  export let onApplyFilters: () => void;
  export let onUpdateStatus: (
    activityId: number,
    status: ActivityStatus
  ) => void;
  export let onSubmitNote: (event: SubmitEvent, activityId: number) => void;
</script>

<section class="panel">
  <div class="panel-heading filters">
    <div>
      <p class="eyebrow">Starter feature</p>
      <h2>Track activity status</h2>
    </div>

    <div class="toolbar">
      <label>
        Search
        <input bind:value={search} placeholder="Search title, host, or cabin" />
      </label>

      <label>
        Status
        <select bind:value={selectedStatus}>
          <option value="all">all</option>
          {#each statusOptions as status}
            <option value={status}>{status}</option>
          {/each}
        </select>
      </label>

      <button type="button" class="secondary" on:click={onApplyFilters}>
        Apply filters
      </button>
    </div>
  </div>

  {#if error}
    <p class="error-banner">{error}</p>
  {/if}

  {#if loading}
    <p class="status-copy">Loading activities...</p>
  {:else}
    <div class="activity-list">
      {#each activities as activity}
        <article class="activity-card">
          <div class="card-header">
            <div>
              <p class="card-meta">
                {activity.cabin} • {activity.scheduledFor}
              </p>
              <h3>{activity.title}</h3>
              <p class="card-copy">{activity.details}</p>
            </div>

            <div class="badge-stack">
              <span class={`badge priority ${activity.priority}`}
                >{activity.priority}</span
              >
              <span class={`badge status ${activity.status}`}
                >{activity.status}</span
              >
            </div>
          </div>

          <div class="card-row">
            <p><strong>Host:</strong> {activity.host}</p>
            <label>
              Update status
              <select
                value={activity.status}
                on:change={(event) =>
                  onUpdateStatus(
                    activity.id,
                    (event.currentTarget as HTMLSelectElement)
                      .value as ActivityStatus
                  )}
              >
                {#each statusOptions as status}
                  <option value={status}>{status}</option>
                {/each}
              </select>
            </label>
          </div>

          <section class="notes-panel">
            <div class="notes-heading">
              <h4>Notes</h4>
              <span>{activity.notes.length}</span>
            </div>

            {#if activity.notes.length}
              <ul>
                {#each activity.notes as note}
                  <li>
                    <p>{note.body}</p>
                    <small>{note.author} • {note.createdAt}</small>
                  </li>
                {/each}
              </ul>
            {:else}
              <p class="status-copy">No notes yet.</p>
            {/if}

            <form
              class="note-form"
              on:submit={(event) => onSubmitNote(event, activity.id)}
            >
              <input
                bind:value={noteDrafts[activity.id]}
                placeholder="Add a status note"
              />
              <button type="submit" class="secondary">Save note</button>
            </form>
          </section>
        </article>
      {/each}
    </div>
  {/if}
</section>
