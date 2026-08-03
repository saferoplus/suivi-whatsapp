export default async function handler(req, res) {
  if (req.method === "GET") {
    if (req.query["hub.verify_token"] === process.env.VERIFY_TOKEN) {
      return res.status(200).send(req.query["hub.challenge"]);
    }
    return res.status(403).send("non");
  }

  try {
    const body = req.body || {};
    const entries = body.entry || [];
    for (const e of entries) {
      const changes = e.changes || [];
      for (const c of changes) {
        const value = c.value || {};
        const messages = value.messages || [];
        for (const m of messages) {
          console.log("DE:", m.from);
          if (m.referral) {
            const donnees = {
              ctwa_clid: m.referral.ctwa_clid,
              source_id: m.referral.source_id,
              date: new Date().toISOString(),
            };
            await redis([
              "SET",
              `clid:${m.from}`,
              JSON.stringify(donnees),
              "EX",
              604800,
            ]);
            console.log("PUB ENREGISTREE:", donnees);
          } else {
            console.log("Message organique");
          }
        }
      }
    }
  } catch (err) {
    console.error(err);
  }

  return res.status(200).send("ok");
}

async function redis(commande) {
  const r = await fetch(process.env.KV_REST_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commande),
  });
  return r.json();
}
