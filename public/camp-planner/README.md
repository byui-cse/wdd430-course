# Camp Activity Tracker

This project is a self-contained web development exercise for a web course. It includes:

- A Svelte frontend built with Vite
- A small local Express API
- A SQLite database powered by Node's built-in `node:sqlite` module
- Seeded camp activity data

The starter app already supports a complete vertical slice:

- Listing activities
- Filtering by search and status
- Creating a new activity
- Updating activity status
- Adding notes to an activity

Students can then use AI tools to generate and review additional features.

## Run the app

Install dependencies:

```bash
pnpm install
```

Run the frontend and API together:

```bash
pnpm dev:full
```

Frontend: `http://localhost:5173`

API: `http://localhost:3001`

The SQLite database is created automatically in `data/cabin-tracker.sqlite` the first time the API starts.

## Available scripts

```bash
pnpm dev:app
pnpm dev:server
pnpm dev:full
pnpm start:server
pnpm build
pnpm check
```

## Starter data model

### `activities`

- `id`
- `title`
- `camp area` label in the UI maps to the existing `cabin` field in the database
- `scheduled_for`
- `status`
- `priority`
- `host`
- `details`
- `created_at`

### `activity_notes`

- `id`
- `activity_id`
- `body`
- `author`
- `created_at`

## Suggested student feature map

### Core follow-up features

- Edit an existing activity
- Delete an activity
- Filter by camp area and priority
- Sort by date or status
- Add validation messages in the UI

### Intermediate features

- Assign students or staff to an activity
- Create a detail view modal or drawer
- Add completion summaries or dashboard widgets
- Add a second table for supplies or materials
- Add an archive view for completed activities

### Stretch features

- Add automated tests for the API and UI
- Support bulk status updates
- Export activities as JSON or CSV
- Add due-soon highlighting logic
- Introduce schema migrations for a new field
- Move API calls out of App.svelte into a dedicated service module while preserving behavior

## Example AI prompts for students

- `Add an edit activity form that follows the current API style and updates the list after save.`
- `Create a delete button for each activity and add a matching API endpoint.`
- `Add a supply checklist table in SQLite and show it under each activity.`
- `Write a test for creating an activity with missing required fields.`
- `Refactor the activity list into reusable Svelte components without changing behavior.`

## Instructor notes

- Keep the app local-first so students can focus on web development, not deployment.
- Require students to explain generated code before accepting it.
- Ask students to compare AI output against the existing conventions in the app.
- Encourage small prompts tied to one feature at a time.
