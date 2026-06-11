<script lang="ts">
  export let featureRoadmap: string[] = [];
</script>

<aside class="panel roadmap-panel">
  <div class="panel-heading">
    <div>
      <p class="eyebrow">Student roadmap</p>
      <h2>AI extension targets</h2>
    </div>
  </div>

  <p class="caption">
    The application ships with a working data model, seeded records, filtering,
    creation, status updates, and note creation. Students use AI to implement
    the next layers.
  </p>

  <ol>
    {#each featureRoadmap as item}
      <li>{item}</li>
    {/each}
  </ol>

  <div class="prompt-card">
    <p class="eyebrow">Example prompt</p>
    <p>
      Add an edit activity dialog that reuses the existing API style, validates
      required fields, and refreshes the activity list after save.
    </p>
  </div>
</aside>
