import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  const store = getStore({ name: "leaderboard", consistency: "strong" });

  if (req.method === "GET") {
    const { blobs } = await store.list();
    const entries = [];
    for (const blob of blobs) {
      const data = await store.get(blob.key, { type: "json" });
      if (data) entries.push(data);
    }
    entries.sort((a, b) => (b.units || 0) - (a.units || 0));
    return new Response(JSON.stringify(entries), {
      headers: { "Content-Type": "application/json" }
    });
  }

  if (req.method === "POST") {
    const body = await req.json();
    const { agentName, month, units, appts, calls, texts, emails, tasks, goalUnits, paceStatus } = body;
    if (!agentName || !month) {
      return new Response(JSON.stringify({ error: "agentName and month are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const key = `${month}::${agentName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    const entry = {
      agentName,
      month,
      units: units || 0,
      appts: appts || 0,
      calls: calls || 0,
      texts: texts || 0,
      emails: emails || 0,
      tasks: tasks || 0,
      goalUnits: goalUnits || 0,
      paceStatus: paceStatus || "—",
      contacts: (calls || 0) + (texts || 0) + (emails || 0),
      updatedAt: new Date().toISOString()
    };
    await store.setJSON(key, entry);
    return new Response(JSON.stringify({ ok: true, entry }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config = {
  path: "/api/leaderboard"
};
