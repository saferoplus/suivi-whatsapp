export default async function handler(req, res) {
  const { numero, montant, cle } = req.query;

  if (cle !== process.env.CLE_VENTE) return res.status(401).send("non");
  if (!numero) return res.status(400).send("numero manquant");

  // 1. Retrouver la pub d'origine dans Redis
  const r = await fetch(
    `${process.env.KV_REST_API_URL}/get/clid:${numero}`,
    { headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` } }
  );
  const { result } = await r.json();
  if (!result) return res.status(404).send("aucune pub pour ce numero");
  const pub = JSON.parse(result);

  // 2. Envoyer l'evenement a Meta
  const event = {
    event_name: "Purchase",
    event_time: Math.floor(Date.now() / 1000),
    action_source: "business_messaging",
    messaging_channel: "whatsapp",
    user_data: {
      ctwa_clid: pub.ctwa_clid,
      whatsapp_business_account_id: process.env.WABA_ID
    },
    custom_data: { currency: "XOF", value: Number(montant || 0) }
  };

  const meta = await fetch(
    `https://graph.facebook.com/v21.0/${process.env.DATASET_ID}/events?access_token=${process.env.ACCESS_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [event] })
    }
  );
  const rep = await meta.json();
  console.log("META", JSON.stringify(rep));
  res.status(200).json(rep);
}
