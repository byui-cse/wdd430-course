# Copilot Instructions for Course Content

## Project Purpose

This repository is an Astro static site used to publish BYU-Idaho course content.

Prioritize content authoring tasks over framework-level refactors unless explicitly requested.

## Tech and Runtime

- Astro 5 with content collections and static routes.
- Markdown and MDX content under src/content.
- Svelte is present for interactive sections (bakeoff and peer-review) but most course content is static.
- Package manager: pnpm.

## Canonical Content Configuration

Use src/content.config.ts as the source of truth for active course collections:

- ponder
- resources
- units
- prepare
- prove

There is also src/content/config.ts from an older setup. Do not add new course-content schema there unless asked to migrate legacy content.

## Where to Add New Content

Place new files in the collection folder that matches the intended route:

- src/content/prepare -> /prepare/[id]
- src/content/prove -> /prove/[id]
- src/content/ponder -> /ponder/[id]
- src/content/resources -> /resources/[id]
- src/content/units -> /units/[id]

The id is derived from the filename (without extension).

## Frontmatter Requirements by Collection

### prepare

Expected by listing and detail pages:

- title: string (required)
- time: string (required)
- aiUsage: green | yellow | red (strongly recommended)
- description: string (optional)

### prove

Expected by listing and detail pages:

- title: string (required)
- time: string (required)
- aiUsage: green | yellow | red (strongly recommended)
- description: string (optional)

### ponder

Expected by listing and detail pages:

- title: string (required)
- description: string (required for index summaries)
- time: string (recommended)
- aiUsage: green | yellow | red (strongly recommended)
- tags: string[] (optional)

### resources

Expected by listing and detail pages:

- title: string (required)
- description: string (required for index summaries)
- time: string (recommended)
- aiUsage: green | yellow | red (optional)

### units

Expected by unit index and home page:

- title: string (required)
- summary: string (required)
- tags: string[] (required)
- slug: string (required)

Important: keep units slug equal to filename id whenever possible (for example filename unit4.mdx with slug: unit4) to avoid routing mismatches between pages.

## Content Style and Authoring Conventions

- Use clear instructional structure with headings such as Overview, Steps, and Submission.
- Preserve course voice: direct, practical, and student-facing.
- Prefer concise paragraphs and ordered task steps.
- Use markdown links for internal content navigation.
- Use MDX when you need Astro components.

## Existing Components Commonly Used in MDX

- AIUsage: src/components/AIUsage.astro
- Details: src/components/Details.astro
- Figure: src/components/Figure.astro
- Video: src/components/Video.astro

When importing from content files, use relative imports (for example from a file in src/content/ponder, import components from ../../components/...).

## Internal Linking Patterns

Follow existing relative link patterns:

- From units files, link to activities like ../../prepare/unit1a
- From prepare/prove/ponder/resources, link to sibling content using relative paths without file extensions

Prefer links that match collection route ids.

## Do Not Change Unless Requested

- Global styling and layout structure.
- Header navigation structure.
- Svelte app pages for bakeoff and peer-review.
- Site metadata unless requested.

## Validation Checklist for Content Additions

After adding or modifying content:

1. Confirm frontmatter keys match collection expectations.
2. Confirm filename id and unit slug consistency.
3. Confirm all internal links resolve logically.
4. Run pnpm build and fix any content or route errors.

## Notes for AI Agents

When the user asks to add course material:

- Choose the correct collection first.
- Scaffold frontmatter before writing body content.
- Keep section naming consistent with nearby files.
- Prefer minimal, targeted edits and avoid broad refactors.
- Review course guiding principles in docs/course-authoring-notes.md before writing new course content. This location should be treated as the default source for course principles across courses.
