<script lang="ts">
  import type { ActivityPayload, Priority } from "./types";

  export let form: ActivityPayload;
  export let priorityOptions: Priority[] = [];
  export let saving = false;
  export let onSubmit: (event: SubmitEvent) => void;
</script>

<section class="panel">
  <div class="panel-heading">
    <div>
      <p class="eyebrow">Starter feature</p>
      <h2>Create a camp activity</h2>
    </div>
    <p class="caption">
      This form is intentionally complete so students can extend the pattern.
    </p>
  </div>

  <form class="activity-form" on:submit={onSubmit}>
    <label>
      Activity title
      <input
        bind:value={form.title}
        name="title"
        placeholder="Campfire prep"
        required
      />
    </label>

    <div class="split-fields">
      <label>
        Camp area
        <select bind:value={form.cabin} name="cabin">
          <option>North Ridge</option>
          <option>Lakeview</option>
          <option>Cedar Point</option>
          <option>South Fork</option>
        </select>
      </label>

      <label>
        Priority
        <select bind:value={form.priority} name="priority">
          {#each priorityOptions as priority}
            <option value={priority}>{priority}</option>
          {/each}
        </select>
      </label>
    </div>

    <div class="split-fields">
      <label>
        Scheduled for
        <input
          bind:value={form.scheduledFor}
          name="scheduledFor"
          type="date"
          required
        />
      </label>

      <label>
        Activity host
        <input
          bind:value={form.host}
          name="host"
          placeholder="Sam Rivera"
          required
        />
      </label>
    </div>

    <label>
      Details
      <textarea
        bind:value={form.details}
        name="details"
        rows="4"
        placeholder="Materials, setup notes, or staffing reminders"
        required
      ></textarea>
    </label>

    <button type="submit" disabled={saving}>
      {saving ? "Saving..." : "Add activity"}
    </button>
  </form>
</section>
