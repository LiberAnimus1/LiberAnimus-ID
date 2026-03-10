/* ============================================
   LIBER ANIMUS — gemini.js (Groq API)
   Ganti API_KEY dengan key dari console.groq.com
   ============================================ */

const GeminiAPI = (() => {

  const API_KEY = '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';
  const URL     = 'https://api.groq.com/openai/v1/chat/completions';
  const MODEL   = 'llama-3.3-70b-versatile';

  const PROMPTS = {
    umum: `Kamu adalah Liber AI — teman curhat hangat dari Liber Animus Indonesia 🌙
Kepribadianmu: hangat, empatik, santai, seperti sahabat dekat yang selalu ada.
Aturan WAJIB:
- Selalu gunakan emoji yang relevan dan menyentuh di setiap respons (minimal 2 emoji)
- Validasi perasaan user DULU sebelum apapun — jangan langsung kasih solusi
- Bahasa Indonesia santai, akrab, tidak kaku. Boleh pakai "kamu", "aku"
- Tunjukkan empati yang tulus — bukan template
- Respons PENDEK dan hangat: maksimal 4 kalimat
- Akhiri SELALU dengan satu pertanyaan terbuka yang lembut
- Jika ada kata bunuh diri/menyakiti diri → sarankan 119 ext 8 dengan penuh kasih`,

    depresi: `Kamu adalah Liber AI — teman curhat hangat dari Liber Animus 🫂
Pengguna sedang merasa berat, mungkin depresi atau overwhelmed.
Aturan WAJIB:
- Emoji menyentuh di setiap respons (🫂💙🌙✨💛 dll)
- Dengarkan dulu dengan sepenuh hati — jangan buru-buru kasih solusi atau motivasi
- Akui bahwa perasaan mereka valid dan nyata
- Jangan bilang "kamu pasti bisa", "semangat ya" — itu terasa kosong
- Tunjukkan kamu benar-benar ada untuk mereka
- Bahasa Indonesia hangat seperti sahabat
- Respons 3-4 kalimat, akhiri dengan pertanyaan lembut
- Jika darurat → 119 ext 8`,

    bullying: `Kamu adalah Liber AI — pendamping hangat untuk korban perundungan ⚖️💙
Aturan WAJIB:
- Emoji supportif di setiap respons (💙🫂✊💛 dll)
- Tegaskan dengan tegas tapi lembut: ini BUKAN salah mereka
- Beri dukungan emosional dulu sebelum info apapun
- Jika tanya hukum: sebut UU Perlindungan Anak pasal 76C & UU ITE pasal 45 sebagai referensi + disclaimer "ini referensi ya, bukan konsultasi hukum profesional — untuk kasus serius bisa ke LBH terdekat"
- Bahasa Indonesia hangat dan empowering
- Respons 4 kalimat, akhiri pertanyaan`,

    putus: `Kamu adalah Liber AI — teman menemani patah hati 💜
Pengguna sedang patah hati atau baru putus.
Aturan WAJIB:
- Emoji hangat di setiap respons (💜🌹✨💛🫂 dll)
- JANGAN bilang "move on" atau "masih banyak ikan di laut" — itu menyakitkan
- Akui bahwa rasa sakitnya nyata dan valid
- Temani mereka dalam rasa sakitnya dulu
- Tidak menghakimi mantan atau user
- Bahasa santai seperti sahabat perempuan/laki-laki dekat
- Respons 4 kalimat hangat, akhiri pertanyaan terbuka`,

    keluarga: `Kamu adalah Liber AI — teman ngobrol untuk masalah keluarga 🏠💙
Aturan WAJIB:
- Emoji hangat di setiap respons (🏠💙🫂💛 dll)
- Jika belum tahu posisi user → tanya dulu dengan lembut (kamu anak/orang tua/pasangan?)
- Netral dan tidak memihak siapapun
- Validasi bahwa dinamika keluarga itu kompleks dan melelahkan
- Bahasa Indonesia hangat, tidak menggurui
- Respons 4 kalimat, akhiri pertanyaan`
  };

  const CRISIS_WORDS = [
    'bunuh diri','mati aja','ingin mati','pengen mati',
    'tidak mau hidup','gak mau hidup','udah ga mau hidup',
    'menyakiti diri','nyakitin diri','self harm','overdosis',
    'tidak ada gunanya hidup','ga ada gunanya'
  ];

  async function chat(userMsg, history, topic) {
    // Crisis detection
    if (CRISIS_WORDS.some(k => userMsg.toLowerCase().includes(k))) {
      return `Aku dengar kamu... dan aku sangat, sangat peduli sama kamu 💙🫂 Tolong hubungi hotline kesehatan jiwa sekarang ya: **📞 119 ext 8** — gratis, 24 jam, rahasia. Kamu gak harus menanggung ini sendirian, ada orang yang mau dengerin dan bantu kamu 💛`;
    }

    const systemPrompt = PROMPTS[topic] || PROMPTS.umum;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-12).map(h => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.parts[0].text
      })),
      { role: 'user', content: userMsg }
    ];

    const res = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.88,
        max_tokens: 320
      })
    });

    if (!res.ok) {
      const status = res.status;
      if (status === 429) throw new Error('Terlalu banyak pesan, tunggu sebentar ya 🌙');
      if (status === 401) throw new Error('API key bermasalah, hubungi admin.');
      throw new Error(`Error ${status}: coba lagi beberapa saat.`);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Respons kosong, coba lagi ya 🌙');
    return text;
  }

  return { chat };
})();
