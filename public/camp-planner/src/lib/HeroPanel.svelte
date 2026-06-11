<script lang="ts">
  export let totalActivities = 0;
  export let readyCount = 0;
  export let inProgressCount = 0;
  export let noteCount = 0;
</script>

<section class="hero-panel">
  <div class="hero-copy">
    <p class="eyebrow">WDD 360 exercise starter</p>
    <h1>Camp activity tracker</h1>
    <p class="intro">
      Students inherit a working interface backed by a local API and SQLite,
      then use AI to extend the application with richer planning, reporting, and
      data relationships.
    </p>
  </div>

  <div class="stats-grid" aria-label="overview metrics">
    <article>
      <span>Total activities</span>
      <strong>{totalActivities}</strong>
    </article>
    <article>
      <span>Ready this week</span>
      <strong>{readyCount}</strong>
    </article>
    <article>
      <span>In progress</span>
      <strong>{inProgressCount}</strong>
    </article>
    <article>
      <span>Activity notes</span>
      <strong>{noteCount}</strong>
    </article>
  </div>
</section>
