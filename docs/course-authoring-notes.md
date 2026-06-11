# WDD 430 Course Authoring Notes

## Purpose

This guide helps authors create course content aligned with WDD 430's pedagogical approach and quality standards. It complements [course-summary.md](./course-summary.md) (philosophy) and [../.github/copilot-instructions.md](../.github/copilot-instructions.md) (tech/repo mechanics).

## Voice and Tone

Write in a **direct, practical, student-facing** voice:

- Assume students have completed WDD 360 (basic HTML, CSS, JavaScript, DOM, events, Node/Express basics).
- Avoid lecturing; instead, guide exploration and decision-making.
- Use active voice and second-person address ("you will," "your team").
- Emphasize "why" and "how to evaluate" over "what is."
- Keep language clear and concise; avoid jargon without explanation.

**Example good opening:**

> Before you start building your project, you need a clear plan. This specification will help your team articulate what you're trying to build and why, so that when you evaluate different technology stacks in the bakeoffs, you can make an informed choice.

**Avoid:**

> A project specification is a document that outlines requirements.

## Activity Type Patterns

### Prepare Activities

**Purpose:** Equip students to contribute meaningfully to team meetings.

**Typical structure:**

1. **Brief intro** explaining why this preparation matters for the team.
2. **Learning objectives or topics** (often as headings or a list).
3. **Main content:** Reading suggestions, video references, code walkthroughs, or reflection prompts.
4. **Code examples** from real-world projects or tutorials (when relevant).
5. **Tips for reading/learning** (metacognitive guidance).
6. **Submission instruction:** Usually "submit notes and questions from the reading."

**Example:** [src/content/prepare/unit1a.md](../src/content/prepare/unit1a.md)

**Frontmatter expectations:**

- `title` (required)
- `time` (required; e.g., "60-90min")
- `aiUsage` (strongly recommended; typically "green")
- `description` (optional)

### Ponder Activities

**Purpose:** Promote reflection on concepts, tradeoffs, and learning process.

**Typical structure:**

1. **Introduction** framing the question or theme.
2. **Key concepts or resources** to consider (links, definitions, examples).
3. **Reflection prompts** or discussion questions.
4. **Optional reading** or deeper dives (Details component works well here).
5. **No submission** usually; ponder is for internal digestion and team discussion.

**Example:** [src/content/ponder/spec-driven.mdx](../src/content/ponder/spec-driven.mdx)

**Frontmatter expectations:**

- `title` (required)
- `description` (required for listing; should summarize the ponder's core theme)
- `time` (recommended)
- `aiUsage` (strongly recommended)
- `tags` (optional; helps categorize reflect activities)

### Prove Activities

**Purpose:** Build working artifacts and demonstrate learning through experimentation.

**Typical structure:**

1. **Overview** clarifying the goal (e.g., "build a working prototype," "evaluate a stack").
2. **Objectives** (what you will learn or build).
3. **Technical requirements** or scope constraints.
4. **Numbered steps** or phases (01, 02, 03...) with clear deliverables.
5. **Submission** instructions and evaluation link (if applicable).

**Example:** [src/content/prove/bakeoff-1.mdx](../src/content/prove/bakeoff-1.mdx)

**Frontmatter expectations:**

- `title` (required)
- `time` (required)
- `aiUsage` (strongly recommended)
- `description` (optional)

### Unit Overview Files

**Purpose:** Orient students to a multi-week block and show connections between activities.

**Typical structure:**

1. **heading with unit number and theme**
2. **summary** (one sentence explaining the unit focus)
3. **tags** (topic areas)
4. **Prepare section** with bulleted links to that week's preparation activities.
5. **Ponder section** with bulleted links to reflection/discussion topics.
6. **Prove section** with bulleted links to projects/deliverables.

**Example:** [src/content/units/unit1.md](../src/content/units/unit1.md)

**Frontmatter expectations:**

- `title` (required)
- `summary` (required)
- `tags` (required; list of key topics)
- `slug` (required; keep equal to filename id to avoid routing mismatches)

## Component Usage

### AIUsage

**When to use:** On all Prepare and Prove activities; optional on Ponder and Resources.

**How to use:** Include in frontmatter: `aiUsage: green | yellow | red`

- **green:** Encouraged use; students can use AI creatively and should reflect on their experience.
- **yellow:** Instructor-specific guidance (detail in activity body what's allowed).
- **red:** Disallowed; AI use violates assignment intent.

**Example:** [src/content/prepare/unit1a.md](../src/content/prepare/unit1a.md) uses `aiUsage: green`

### Details (collapsible sections)

**When to use:** Optional deep dives, code examples, or tangent solutions.

```mdx
import Details from "../../components/Details.astro";

<Details summary="How to deploy to Vercel">
  [Content goes here—can be multi-paragraph, code blocks, etc.]
</Details>
```

**Example:** [src/content/ponder/api-design.mdx](../src/content/ponder/api-design.mdx)

### Figure (captioned images/diagrams)

**When to use:** To break up text and illustrate concepts (architecture, data models, UI mockups).

```mdx
import Figure from "../../components/Figure.astro";

<Figure src="/path/to/image.png" alt="Descriptive alt text">
  Caption explaining what students should notice.
</Figure>
```

### Video

**When to use:** For tutorials, walkthroughs, or external expert content.

```mdx
import { Video } from "../../components/Video.astro";

<Video src="https://..." title="Video Title" />
```

## Learning Outcome Alignment

WDD 430 has five outcomes. When creating new content, signal which outcome(s) it addresses. You can:

1. Add a note at the start: "This activity supports outcome #2 (Develop full-stack web applications)."
2. Use headings or section introductions to call out alignment.
3. In unit overviews, group activities by outcome emphasis.

**The five outcomes:**

1. Articulate the components of the web full-stack development ecosystem.
2. Develop full-stack web applications using a modern development stack.
3. Use contemporary development and deployment technologies in workflows.
4. Deploy a web application to a cloud infrastructure.
5. Demonstrate the skills of a productive group member.

## Scope and Sequencing Guidelines

### Team vs. Solo Work

- **Prepare:** Mostly solo; students research and synthesize individually before team meetings.
- **Ponder:** Solo or small group; individual reflection fed into team discussion.
- **Prove:** Team-based; deliverables are co-authored or managed via shared repos.

### Timelines

- **Prepare:** 60–120 minutes (one week; condensed enough to be done before team meeting).
- **Ponder:** 30–90 minutes (reading/reflection, no submission; supports team discussion).
- **Prove:** 2+ weeks; scoped as phases or milestones (e.g., "Phase 1: Specification," "Phase 2: Implementation").

### Avoid Overload

- Respect the "only one major team project at a time" constraint.
- During bakeoff weeks (Unit 2), provide preparation but avoid heavy ponder assignments.
- Frame big asks (e.g., final project) as multi-week sprints with clear checkpoints.

## Linking Patterns

### Internal Links

- **From units to activities:** Use relative paths without extensions.
  ```markdown
  - [Week 1 Exploration](../../prepare/unit1a)
  - [API Design](../../ponder/api-design)
  ```
- **From activities to activities:** Use relative paths matching collection IDs.
  ```markdown
  See also: [Project Specification](../../prove/project-proposal)
  ```
- **Cross-unit references:** Use the unit slug or activity ID clearly.
  ```markdown
  In [Unit 2](../../units/unit2), teams evaluate different stacks.
  ```

### External Links

- Prefer official docs (MDN, web.dev, framework docs) over random tutorials.
- Quote or summarize key points; don't assume students will follow every link.
- For third-party tutorials, include a short rationale ("This guide walks you through...").

## Quality Exemplars

### Well-Structured Prepare Activity

[src/content/prepare/unit1a.md](../src/content/prepare/unit1a.md) exemplifies:

- Clear intro with metacognitive tips.
- Curated reading list with thematic grouping.
- Mix of official and supplementary resources.
- Proper frontmatter with time and AI usage.

### Well-Structured Prove Activity

[src/content/prove/bakeoff-1.mdx](../src/content/prove/bakeoff-1.mdx) exemplifies:

- Clear objectives tied to course outcomes.
- Numbered phases with deliverables.
- Embedded guidance on AI use (in-activity detail on yellow assignments).
- Links to evaluation forms and peer review.

### Well-Structured Ponder Activity

[src/content/ponder/api-design.mdx](../src/content/ponder/api-design.mdx) exemplifies:

- Concept introduction with real-world context.
- Scaffolded learning: review → design → documentation.
- Collapsible examples (Details component) for deeper exploration.
- Encouragement to synthesize and iterate.

## Authoring Workflow

1. **Choose collection:** prepare, prove, ponder, resources, or units.
2. **Scaffold frontmatter** with required fields (see [../.github/copilot-instructions.md](../.github/copilot-instructions.md) for details).
3. **Write intro/context:** Why does this activity matter? What will students do?
4. **Structure content** following the type pattern above.
5. **Add components** (AIUsage, Details, Figure, Video) where helpful; don't overuse.
6. **Link to related content** using relative paths.
7. **Review for voice consistency:**
   - Active voice, second-person address.
   - Clear "why," not just "what."
   - Practical and student-focused.
8. **Build and validate:** Run `pnpm build` and check routes.
9. **Verify internal links** resolve to correct collection IDs.

## Special Considerations

### Bakeoff Activities

Bakeoffs are high-stakes comparisons. When writing:

- Emphasize **evaluation over implementation:** "How does this stack handle authentication?"
- Encourage **documentation of tradeoffs:** "What surprised you? What would you do differently?"
- Include **reflection prompts:** "How did this stack's learning curve compare to the last one?"

### Final Project Guidance

The final project (Unit 3) represents synthesis of the entire course. When contributing:

- Balance **autonomy with structure:** Give teams freedom to scope, but clear minimum requirements.
- Encourage **evidence-based decisions:** "Choose features your bakeoff taught you to prioritize."
- Stress **team practices:** Git workflow, planning, communication, peer review.

### AI as a Tool

Frame AI throughout the course:

- **Green assignments:** Use AI creatively and reflect on the experience.
- **Yellow assignments:** Follow the specific guidance; often this is "AI to help, not to do."
- **Red assignments:** AI use is off-limits; build skills directly.
- Always: "Review, verify, and adapt AI output."

## Maintenance and Evolution

As the course evolves:

- **Update exemplars:** If new best practices emerge, update the exemplar activities.
- **Keep syllabus current:** [src/content/resources/syllabus.mdx](../src/content/resources/syllabus.mdx) is the source of truth for learning outcomes and policies.
- **Track outcome coverage:** Periodically audit activities to ensure all five outcomes are well-represented.
- **Solicit student feedback:** Use surveys or discussion forums to understand what resonates and what feels outdated.

## References

- [Course Summary](./course-summary.md) – Philosophy and pedagogy.
- [Syllabus](../src/content/resources/syllabus.mdx) – Policies, outcomes, grading.
- [Copilot Instructions](../.github/copilot-instructions.md) – Tech stack, config, repo patterns.
