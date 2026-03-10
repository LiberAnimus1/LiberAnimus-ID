/* ============================================
   LIBER ANIMUS — Vercel Serverless Function
   /api/chat.js — API key aman di server
   ============================================ */

export default async function handler(req, res) {

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // CORS — ganti dengan domain Vercel lo yang sebenarnya
  const origin  = req.headers.origin || '';
  const allowed = ['https://liber-animus-id.vercel.app', 'http://localhost:3000'];
  if (process.env.NODE_ENV !== 'development' && !allowed.some(o => origin.startsWith(o))) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Parse body
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { messages, topic } = body || {};

  // Validasi
  if (!Array.isArray(messages) || !messages.length) return res.status(400).json({ error: 'messages required' });
  if (messages.length > 25) return res.status(400).json({ error: 'Too many messages' });
  for (const m of messages) {
    if (typeof m.content !== 'string' || m.content.length > 2000) return res.status(400).json({ error: 'Message too long' });
  }

  const ALLOWED_TOPICS = ['umum','depresi','bullying','putus','keluarga'];
  const safeTopic = ALLOWED_TOPICS.includes(topic) ? topic : 'umum';

  const PROMPTS = {
    umum:     `Kamu adalah Liber AI — teman curhat hangat 🌙 Selalu pakai emoji, validasi perasaan dulu, bahasa Indonesia santai, respons max 4 kalimat, akhiri pertanyaan. Jika krisis → 119 ext 8.`,
    depresi:  `Kamu adalah Liber AI — teman curhat untuk yang sedang berat 🫂 Dengarkan dulu, jangan langsung kasih solusi, akui perasaan valid, max 4 kalimat, akhiri pertanyaan lembut. Jika krisis → 119 ext 8.`,
    bullying: `Kamu adalah Liber AI — pendamping korban perundungan ⚖️💙 Tegaskan bukan salah mereka, dukung emosional dulu, referensi UU bila ditanya, max 4 kalimat.`,
    putus:    `Kamu adalah Liber AI — teman patah hati 💜 Jangan bilang "move on", akui rasa sakit valid, temani dulu, max 4 kalimat hangat.`,
    keluarga: `Kamu adalah Liber AI — teman masalah keluarga 🏠💙 Netral, tidak memihak, validasi kompleksitas, max 4 kalimat.`
  };

  // Crisis check server-side
  const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || '';
  const CRISIS  = ['bunuh diri','mati aja','ingin mati','pengen mati','tidak mau hidup','gak mau hidup','menyakiti diri','self harm','overdosis'];
  if (CRISIS.some(k => lastMsg.includes(k))) {
    return res.status(200).json({ reply: 'Aku dengar kamu... dan aku sangat peduli sama kamu 💙🫂 Tolong hubungi hotline: **📞 119 ext 8** — gratis, 24 jam, rahasia. Kamu tidak sendirian 💛' });
  }

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: PROMPTS[safeTopic] }, ...messages],
        temperature: 0.88,
        max_tokens: 320
      })
    });

    if (!groqRes.ok) return res.status(groqRes.status).json({ error: `API error ${groqRes.status}` });
    const data  = await groqRes.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) return res.status(502).json({ error: 'Empty response' });
    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}
