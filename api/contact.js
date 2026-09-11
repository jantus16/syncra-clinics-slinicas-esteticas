module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Método no permitido" });
  }

  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error("N8N_WEBHOOK_URL no está configurada en las variables de entorno");
    return res.status(500).json({ ok: false, error: "Configuración del servidor incompleta" });
  }

  try {
    const n8nResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body || {}),
    });

    if (!n8nResponse.ok) {
      const text = await n8nResponse.text().catch(() => "");
      console.error("El webhook de n8n respondió con error:", n8nResponse.status, text);
      return res.status(502).json({ ok: false, error: "El webhook rechazó la solicitud" });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error al reenviar la solicitud al webhook de n8n:", error);
    return res.status(500).json({ ok: false, error: "No se pudo contactar con el webhook" });
  }
};
