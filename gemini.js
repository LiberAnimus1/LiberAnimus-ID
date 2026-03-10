const GeminiAPI = (() => {

  const RATE_LIMIT  = 8;
  const RATE_WINDOW = 60 * 1000;
  let timestamps    = [];

  function checkRate() {
    const now = Date.now();
    timestamps = timestamps.filter(t => now - t < RATE_WINDOW);
    if (timestamps.length >= RATE_LIMIT) return false;
    timestamps.push(now);
    return true;
  }

  async function chat(userMsg, history, topic) {
    if (!checkRate()) throw new Error('Pelan-pelan ya 🌙 Tunggu sebentar sebelum kirim lagi.');

    const messages = [
      ...history.slice(-12).map(h => ({
        role:    h.role === 'model' ? 'assistant' : 'user',
        content: h.parts[0].text
      })),
      { role: 'user', content: userMsg }
    ];

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, topic })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 429) throw new Error('Terlalu banyak pesan, tunggu sebentar ya 🌙');
      if (res.status === 403) throw new Error('Akses ditolak.');
      throw new Error(err.error || `Error ${res.status}`);
    }

    const data = await res.json();
    if (!data.reply) throw new Error('Respons kosong, coba lagi ya 🌙');
    return data.reply;
  }

  return { chat };
})();
