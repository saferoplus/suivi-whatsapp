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
            console.log("PUB:", m.referral.source_id);
            console.log("CLID:", m.referral.ctwa_clid);
          } else {
            console.log("Message organique");
          }
        }
      }
    }
  } catch (err) {
    console.error(err);
    }
  return res.status(200).json({ ok: true });
}
