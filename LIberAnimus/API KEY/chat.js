/* ============================================
   LIBER ANIMUS — chat.js
   ============================================ */

const LiberChat = (() => {
  let history = [];
  let topic = 'umum';
  let sending = false;
  let anonCode = '';

  const TOPIC_META = {
    umum:     { icon: '🌙', name: 'Curhat Bebas' },
    depresi:  { icon: '🫂', name: 'Perasaan Berat' },
    bullying: { icon: '⚖️', name: 'Perundungan' },
    putus:    { icon: '💔', name: 'Patah Hati' },
    keluarga: { icon: '🏠', name: 'Keluarga' }
  };

  const OPENERS = {
    umum:     'Hei... senang kamu ada di sini. Gak ada yang perlu disembunyikan — cerita aja perlahan 🌙',
    depresi:  'Hei... aku di sini bersamamu. Cerita aja, aku dengerin 🌙',
    bullying: 'Hei, apa yang kamu alami itu tidak benar dan bukan salahmu. Aku di sini 💙',
    putus:    'Hei... patah hati itu berat banget. Aku di sini, gak ada buru-buru 💜',
    keluarga: 'Hei, masalah keluarga bisa sangat kompleks. Aku siap dengerin ceritamu 🏠'
  };

  function genAnonCode() {
    const colors = ['Biru','Hijau','Ungu','Merah','Kuning','Perak','Emas'];
    return `#${colors[Math.floor(Math.random()*colors.length)]}${Math.floor(1000+Math.random()*9000)}`;
  }

  function addMsg(role, text) {
    const container = document.getElementById('chatMessages');
    if (!container) return null;
    const div = document.createElement('div');
    div.className = `msg msg-${role}`;
    const formatted = (text||'').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    div.innerHTML = `
      <div class="msg-name">${role === 'user' ? `Kamu ${anonCode}` : 'Liber AI 🌙'}</div>
      <div class="msg-content">${formatted}</div>`;
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
    div.innerHTML = `
      <div class="msg-name">Liber AI 🌙</div>
      <div class="msg-content">
        <span class="typing-indicator"><span></span><span></span><span></span></span>
      </div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
  }

  function setUI(disabled) {
    const input = document.getElementById('chatInput');
    const btn = document.getElementById('sendBtn');
    if (input) input.disabled = disabled;
    if (btn) btn.disabled = disabled;
  }

  function updateTopicUI() {
    const meta = TOPIC_META[topic] || TOPIC_META.umum;
    const icon = document.getElementById('topicIcon');
    const name = document.getElementById('topicName');
    if (icon) icon.textContent = meta.icon;
    if (name) name.textContent = meta.name;

    document.querySelectorAll('.topic-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.topic === topic);
    });
  }

  async function sendMessage() {
    if (sending) return;
    const input = document.getElementById('chatInput');
    const text = (input?.value || '').trim();
    if (!text) return;

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
        { role: 'user', parts: [{ text }] },
        { role: 'model', parts: [{ text: reply }] }
      );
      if (history.length > 20) history = history.slice(-20);
    } catch (err) {
      typingEl?.remove();
      addMsg('ai', `Maaf, ada gangguan: ${err.message} 🌙`);
    }

    sending = false;
    setUI(false);
    input?.focus();
  }

  function setTopic(newTopic) {
    topic = newTopic;
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

    const params = new URLSearchParams(window.location.search);
    topic = params.get('topic') || 'umum';

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