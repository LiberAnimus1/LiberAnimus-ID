const LiberChat = (() => {
  let history  = [];
  let topic    = 'umum';
  let sending  = false;
  let anonCode = '';

  const RATE_LIMIT  = 8;
  const RATE_WINDOW = 60 * 1000;
  let msgTimestamps = [];

  function isRateLimited() {
    const now = Date.now();
    msgTimestamps = msgTimestamps.filter(t => now - t < RATE_WINDOW);
    if (msgTimestamps.length >= RATE_LIMIT) return true;
    msgTimestamps.push(now);
    return false;
  }

  function escapeHtml(str) {
    return (str || '')
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  function formatAI(str) {
    return escapeHtml(str)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  function formatUser(str) {
    return escapeHtml(str).replace(/\n/g, '<br>');
  }

  const TOPIC_META = {
    umum:     { icon: '🌙', name: 'Curhat Bebas' },
    depresi:  { icon: '🫂', name: 'Perasaan Berat' },
    bullying: { icon: '⚖️', name: 'Perundungan' },
    putus:    { icon: '💔', name: 'Patah Hati' },
    keluarga: { icon: '🏠', name: 'Keluarga' }
  };

  const OPENERS = {
    umum:     'Hei... senang kamu ada di sini 🌙 Gak ada yang perlu disembunyikan — cerita aja perlahan ya 💙',
    depresi:  'Hei... aku di sini bersamamu 🫂 Gak perlu terburu-buru, cerita aja pelan-pelan ya 💙',
    bullying: 'Hei... apa yang kamu alami itu tidak benar, dan ini bukan salahmu — aku di sini 💙',
    putus:    'Hei... patah hati itu berat banget, dan perasaanmu valid 💔 Aku di sini, gak ada buru-buru 💜',
    keluarga: 'Hei... masalah keluarga bisa sangat kompleks 🏠 Aku siap dengerin ceritamu 💙'
  };

  function addMsg(role, text) {
    const container = document.getElementById('chatMessages');
    if (!container) return null;
    const div = document.createElement('div');
    div.className = `msg msg-${role}`;
    const nameEl    = document.createElement('div');
    nameEl.className = 'msg-name';
    nameEl.textContent = role === 'user' ? `Kamu ${anonCode}` : 'Liber AI 🌙';
    const contentEl = document.createElement('div');
    contentEl.className = 'msg-content';
    contentEl.innerHTML = role === 'user' ? formatUser(text) : formatAI(text);
    div.appendChild(nameEl);
    div.appendChild(contentEl);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
  }

  function showTyping() {
    const container = document.getElementById('chatMessages');
    if (!container) return null;
    const div = document.createElement('div');
    div.className = 'msg msg-ai';
    div.id = 'typingMsg';
    const nameEl = document.createElement('div');
    nameEl.className = 'msg-name';
    nameEl.textContent = 'Liber AI 🌙';
    const contentEl = document.createElement('div');
    contentEl.className = 'msg-content';
    contentEl.innerHTML = '<span class="typing-indicator"><span></span><span></span><span></span></span>';
    div.appendChild(nameEl);
    div.appendChild(contentEl);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
  }

  function setUI(disabled) {
    const input = document.getElementById('chatInput');
    const btn   = document.getElementById('sendBtn');
    if (input) input.disabled = disabled;
    if (btn)   btn.disabled   = disabled;
  }

  function updateTopicUI() {
    const meta = TOPIC_META[topic] || TOPIC_META.umum;
    const icon = document.getElementById('topicIcon');
    const name = document.getElementById('topicName');
    if (icon) icon.textContent = meta.icon;
    if (name) name.textContent = meta.name;
    document.querySelectorAll('.topic-btn, .topic-card').forEach(b => {
      b.classList.toggle('active', b.dataset.topic === topic);
    });
  }

  function genAnonCode() {
    const colors = ['Biru','Hijau','Ungu','Merah','Kuning','Perak','Emas'];
    return `#${colors[Math.floor(Math.random() * colors.length)]}${Math.floor(1000 + Math.random() * 9000)}`;
  }

  async function sendMessage() {
    if (sending) return;
    const input = document.getElementById('chatInput');
    const text  = (input?.value || '').trim();
    if (!text) return;
    if (text.length > 1000) { addMsg('ai', 'Pesan terlalu panjang ya 🙏'); return; }
    if (isRateLimited()) { addMsg('ai', 'Pelan-pelan ya 🌙 Tunggu sebentar sebelum kirim lagi.'); return; }

    sending = true;
    input.value = '';
    if (input.style) input.style.height = 'auto';
    setUI(true);
    addMsg('user', text);
    const typingEl = showTyping();

    try {
      const reply = await GeminiAPI.chat(text, history, topic);
      typingEl?.remove();
      addMsg('ai', reply);
      history.push(
        { role: 'user',  parts: [{ text }] },
        { role: 'model', parts: [{ text: reply }] }
      );
      if (history.length > 20) history = history.slice(-20);
    } catch (err) {
      typingEl?.remove();
      addMsg('ai', `Maaf, ada gangguan sebentar 🌙 Coba lagi ya.`);
    } finally {
      sending = false;
      setUI(false);
      input?.focus();
    }
  }

  function setTopic(newTopic) {
    const allowed = ['umum','depresi','bullying','putus','keluarga'];
    if (!allowed.includes(newTopic)) return;
    topic   = newTopic;
    history = [];
    const container = document.getElementById('chatMessages');
    if (container) container.innerHTML = '';
    updateTopicUI();
    addMsg('ai', OPENERS[topic] || OPENERS.umum);
  }

  function init() {
    anonCode = sessionStorage.getItem('la_anon') || genAnonCode();
    sessionStorage.setItem('la_anon', anonCode);
    const codeEl = document.getElementById('anonCode');
    if (codeEl) codeEl.textContent = anonCode;
    const allowed = ['umum','depresi','bullying','putus','keluarga'];
    const param   = new URLSearchParams(window.location.search).get('topic') || 'umum';
    topic = allowed.includes(param) ? param : 'umum';
    updateTopicUI();
    addMsg('ai', OPENERS[topic] || OPENERS.umum);
    document.getElementById('sendBtn')?.addEventListener('click', sendMessage);
    document.getElementById('chatInput')?.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
  }

  return { init, setTopic, sendMessage };
})();

document.addEventListener('DOMContentLoaded', LiberChat.init);
