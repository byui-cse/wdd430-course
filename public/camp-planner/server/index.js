import express from "express";
import { mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, "../data");
mkdirSync(dataDir, { recursive: true });

const databasePath = resolve(dataDir, "cabin-tracker.sqlite");
const db = new DatabaseSync(databasePath);
const app = express();
const port = 3001;
const validStatuses = ["planned", "ready", "in-progress", "done"];
const validPriorities = ["low", "medium", "high"];

app.use(express.json());

initializeDatabase();

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, databasePath });
});

app.get("/api/activities", (request, response) => {
  const search = String(request.query.search ?? "")
    .trim()
    .toLowerCase();
  const status = String(request.query.status ?? "").trim();

  let sql = `
    SELECT id, title, cabin, scheduled_for, status, priority, host, details, created_at
    FROM activities
    WHERE 1 = 1
  `;
  const params = [];

  if (search) {
    sql += ` AND (lower(title) LIKE ? OR lower(cabin) LIKE ? OR lower(host) LIKE ?)`;
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  if (status && validStatuses.includes(status)) {
    sql += ` AND status = ?`;
    params.push(status);
  }

  sql += " ORDER BY scheduled_for ASC, id DESC";

  const rows = db.prepare(sql).all(...params);
  const notesStatement = db.prepare(`
    SELECT id, activity_id, body, author, created_at
    FROM activity_notes
    WHERE activity_id = ?
    ORDER BY id DESC
  `);

  response.json(
    rows.map((row) => ({
      id: row.id,
      title: row.title,
      cabin: row.cabin,
      scheduledFor: row.scheduled_for,
      status: row.status,
      priority: row.priority,
      host: row.host,
      details: row.details,
      createdAt: row.created_at,
      notes: notesStatement.all(row.id).map((note) => ({
        id: note.id,
        activityId: note.activity_id,
        body: note.body,
        author: note.author,
        createdAt: note.created_at
      }))
    }))
  );
});

app.post("/api/activities", (request, response) => {
  const title = String(request.body.title ?? "").trim();
  const cabin = String(request.body.cabin ?? "").trim();
  const scheduledFor = String(request.body.scheduledFor ?? "").trim();
  const host = String(request.body.host ?? "").trim();
  const details = String(request.body.details ?? "").trim();
  const priority = String(request.body.priority ?? "medium").trim();

  if (!title || !cabin || !scheduledFor || !host || !details) {
    response
      .status(400)
      .json({ error: "Title, cabin, date, host, and details are required." });
    return;
  }

  if (!validPriorities.includes(priority)) {
    response
      .status(400)
      .json({ error: "Priority must be low, medium, or high." });
    return;
  }

  const statement = db.prepare(`
    INSERT INTO activities (title, cabin, scheduled_for, status, priority, host, details, created_at)
    VALUES (?, ?, ?, 'planned', ?, ?, ?, ?)
  `);

  const result = statement.run(
    title,
    cabin,
    scheduledFor,
    priority,
    host,
    details,
    timestamp()
  );

  response.status(201).json({ id: Number(result.lastInsertRowid) });
});

app.patch("/api/activities/:id/status", (request, response) => {
  const activityId = Number(request.params.id);
  const status = String(request.body.status ?? "").trim();

  if (!Number.isInteger(activityId) || activityId < 1) {
    response.status(400).json({ error: "A valid activity id is required." });
    return;
  }

  if (!validStatuses.includes(status)) {
    response
      .status(400)
      .json({ error: "Status must be planned, ready, in-progress, or done." });
    return;
  }

  const result = db
    .prepare("UPDATE activities SET status = ? WHERE id = ?")
    .run(status, activityId);

  if (result.changes === 0) {
    response.status(404).json({ error: "Activity not found." });
    return;
  }

  response.json({ ok: true });
});

app.post("/api/activities/:id/notes", (request, response) => {
  const activityId = Number(request.params.id);
  const body = String(request.body.body ?? "").trim();
  const author =
    String(request.body.author ?? "Student Team").trim() || "Student Team";

  if (!Number.isInteger(activityId) || activityId < 1) {
    response.status(400).json({ error: "A valid activity id is required." });
    return;
  }

  if (!body) {
    response.status(400).json({ error: "A note body is required." });
    return;
  }

  const existing = db
    .prepare("SELECT id FROM activities WHERE id = ?")
    .get(activityId);
  if (!existing) {
    response.status(404).json({ error: "Activity not found." });
    return;
  }

  const result = db
    .prepare(
      `
    INSERT INTO activity_notes (activity_id, body, author, created_at)
    VALUES (?, ?, ?, ?)
  `
    )
    .run(activityId, body, author, timestamp());

  response.status(201).json({ id: Number(result.lastInsertRowid) });
});

app.listen(port, () => {
  console.log(`Camp activity API listening on http://localhost:${port}`);
});

function initializeDatabase() {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      cabin TEXT NOT NULL,
      scheduled_for TEXT NOT NULL,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      host TEXT NOT NULL,
      details TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_id INTEGER NOT NULL,
      body TEXT NOT NULL,
      author TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
    );
  `);

  const count = db
    .prepare("SELECT COUNT(*) AS count FROM activities")
    .get().count;
  if (count > 0) return;

  const insertActivity = db.prepare(`
    INSERT INTO activities (title, cabin, scheduled_for, status, priority, host, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertNote = db.prepare(`
    INSERT INTO activity_notes (activity_id, body, author, created_at)
    VALUES (?, ?, ?, ?)
  `);

  const activities = [
    {
      title: "Campfire setup and seating",
      cabin: "North Ridge",
      scheduledFor: "2026-06-15",
      status: "ready",
      priority: "high",
      host: "Sam Rivera",
      details:
        "Stage benches, check lantern fuel, and confirm the song list with counselors."
    },
    {
      title: "Kayak safety briefing",
      cabin: "Lakeview",
      scheduledFor: "2026-06-16",
      status: "planned",
      priority: "medium",
      host: "Noah Patel",
      details:
        "Prepare life jackets, dock checklist, and the short weather update before launch."
    },
    {
      title: "Cabin supply inventory",
      cabin: "Cedar Point",
      scheduledFor: "2026-06-17",
      status: "in-progress",
      priority: "medium",
      host: "Avery Kim",
      details:
        "Count craft bins, replace missing flashlights, and log damaged recreation gear."
    },
    {
      title: "Trail cleanup rotation",
      cabin: "South Fork",
      scheduledFor: "2026-06-18",
      status: "done",
      priority: "low",
      host: "Jordan Lee",
      details:
        "Assign teams, empty trail bins, and record hazards found during the morning pass."
    }
  ];

  for (const activity of activities) {
    const result = insertActivity.run(
      activity.title,
      activity.cabin,
      activity.scheduledFor,
      activity.status,
      activity.priority,
      activity.host,
      activity.details,
      timestamp()
    );
    const activityId = Number(result.lastInsertRowid);

    insertNote.run(
      activityId,
      `Seeded starter note for ${activity.title.toLowerCase()}.`,
      "Instructor Seed",
      timestamp()
    );
  }
}

function timestamp() {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}
