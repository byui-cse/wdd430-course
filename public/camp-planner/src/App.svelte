<script lang="ts">
  import { onMount } from "svelte";
  import HeroPanel from "./lib/HeroPanel.svelte";
  import ActivityCreationPanel from "./lib/ActivityCreationPanel.svelte";
  import ActivityStatusPanel from "./lib/ActivityStatusPanel.svelte";
  import RoadmapPanel from "./lib/RoadmapPanel.svelte";
  import type {
    Activity,
    ActivityPayload,
    ActivityStatus,
    Priority
  } from "./lib/types";

  const statusOptions: ActivityStatus[] = [
    "planned",
    "ready",
    "in-progress",
    "done"
  ];
  const priorityOptions: Priority[] = ["low", "medium", "high"];
  const featureRoadmap = [
    "Add edit and delete flows for activities.",
    "Support filtering by host, priority, and date range.",
    "Add a participant assignment table and UI.",
    "Create a weekly summary dashboard with charts or trend cards.",
    "Write tests for the API routes and the Svelte form behavior."
  ];

  let activities: Activity[] = [];
  let loading = true;
  let saving = false;
  let error = "";
  let selectedStatus = "all";
  let search = "";
  let noteDrafts: Record<number, string> = {};
  let form: ActivityPayload = {
    title: "",
    cabin: "North Ridge",
    scheduledFor: "",
    priority: "medium",
    host: "",
    details: ""
  };

  async function loadActivities() {
    loading = true;
    error = "";

    const params = new URLSearchParams();
    if (selectedStatus !== "all") params.set("status", selectedStatus);
    if (search.trim()) params.set("search", search.trim());

    const response = await fetch(`/api/activities?${params.toString()}`);
    if (!response.ok) {
      error = "Could not load activities from the local API.";
      loading = false;
      return;
    }

    activities = await response.json();
    loading = false;
  }

  async function createActivity() {
    saving = true;
    error = "";

    const response = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (!response.ok) {
      const data = await response
        .json()
        .catch(() => ({ error: "Could not save the activity." }));
      error = data.error;
      saving = false;
      return;
    }

    form = {
      title: "",
      cabin: form.cabin,
      scheduledFor: "",
      priority: "medium",
      host: "",
      details: ""
    };
    await loadActivities();
    saving = false;
  }

  async function updateStatus(activityId: number, status: ActivityStatus) {
    const response = await fetch(`/api/activities/${activityId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      error = "Could not update the activity status.";
      return;
    }

    await loadActivities();
  }

  async function addNote(activityId: number) {
    const body = noteDrafts[activityId]?.trim();
    if (!body) return;

    const response = await fetch(`/api/activities/${activityId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, author: "Student Team" })
    });

    if (!response.ok) {
      error = "Could not save the note.";
      return;
    }

    noteDrafts = {
      ...noteDrafts,
      [activityId]: ""
    };
    await loadActivities();
  }

  function submitActivity(event: SubmitEvent) {
    event.preventDefault();
    void createActivity();
  }

  function submitNote(event: SubmitEvent, activityId: number) {
    event.preventDefault();
    void addNote(activityId);
  }

  $: totalActivities = activities.length;
  $: readyCount = activities.filter(
    (activity) => activity.status === "ready"
  ).length;
  $: inProgressCount = activities.filter(
    (activity) => activity.status === "in-progress"
  ).length;
  $: noteCount = activities.reduce(
    (total, activity) => total + activity.notes.length,
    0
  );

  onMount(() => {
    void loadActivities();
  });
</script>

<svelte:head>
  <title>Camp Activity Tracker</title>
  <meta
    name="description"
    content="A local-first Svelte and SQLite starter app for a camp activity tracking exercise."
  />
</svelte:head>

<main class="shell">
  <HeroPanel {totalActivities} {readyCount} {inProgressCount} {noteCount} />

  <section class="workspace">
    <div class="left-column">
      <ActivityCreationPanel
        bind:form
        {priorityOptions}
        {saving}
        onSubmit={submitActivity}
      />

      <ActivityStatusPanel
        {activities}
        {loading}
        {error}
        bind:search
        bind:selectedStatus
        {statusOptions}
        bind:noteDrafts
        onApplyFilters={() => void loadActivities()}
        onUpdateStatus={(activityId, status) =>
          void updateStatus(activityId, status)}
        onSubmitNote={submitNote}
      />
    </div>

    <RoadmapPanel {featureRoadmap} />
  </section>
</main>
