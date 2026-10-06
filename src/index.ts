type Env = {
  DB: D1Database;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
    },
  });

export default {
  async fetch(request, env: Env) {
    if (request.method !== "POST") {
      return json({ error: "Use POST." }, 405);
    }

    const raw = await request.text();
    let text: string;
    try {
      const parsed = JSON.parse(raw);
      text = typeof parsed === "string" ? parsed : String(parsed?.text ?? "");
    } catch {
      text = raw;
    }
    text = text.trim();
    if (!text) return json({ error: "Body must contain text." }, 400);

    const receivedAt = new Date().toISOString();
    await env.DB.prepare(
      "INSERT INTO feedback (text, received_at) VALUES (?1, ?2)",
    )
      .bind(text, receivedAt)
      .run();

    return json({ ok: true, text, received_at: receivedAt }, 201);
  },
} satisfies ExportedHandler<Env>;
