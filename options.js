const container = document.getElementById('glossary-container');
const statusEl = document.getElementById('status');

function showStatus(msg) {
  statusEl.textContent = msg;
  statusEl.style.display = 'block';
  setTimeout(() => (statusEl.style.display = 'none'), 2000);
}

async function loadAll() {
  const result = await chrome.storage.local.get({ glossaries: {} });
  const glossaries = result.glossaries;

  container.innerHTML = '';

  const codes = Object.keys(glossaries);
  if (codes.length === 0) {
    container.innerHTML = '<div class="empty">등록된 용어집이 없습니다.<br>소설 페이지에서 "이름 추출" 버튼으로 자동 추출하거나,<br>아래에 소설 코드를 입력해 수동으로 추가하세요.</div>';
  }

  for (const code of codes.sort()) {
    const glossary = glossaries[code];
    const section = document.createElement('div');
    section.className = 'novel-section';

    let entriesHtml = '';
    for (const [jp, kr] of Object.entries(glossary).sort()) {
      entriesHtml += `
        <div class="entry-row">
          <input class="entry-jp" value="${escapeAttr(jp)}" readonly>
          <input class="entry-kr" value="${escapeAttr(kr)}" data-novel="${escapeAttr(code)}" data-jp="${escapeAttr(jp)}">
          <button class="btn-delete" data-novel="${escapeAttr(code)}" data-jp="${escapeAttr(jp)}">삭제</button>
        </div>`;
    }

    section.innerHTML = `
      <div class="novel-header">
        <span class="novel-code">${escapeHtml(code)}</span>
        <button class="btn-delete-novel" data-novel="${escapeAttr(code)}">소설 용어집 삭제</button>
      </div>
      ${entriesHtml}
      <div class="add-row entry-row">
        <input class="entry-jp" placeholder="일본어 원문" data-new-jp="${escapeAttr(code)}">
        <input class="entry-kr" placeholder="한국어 번역" data-new-kr="${escapeAttr(code)}">
        <button class="btn-add" data-add-novel="${escapeAttr(code)}">추가</button>
      </div>
    `;

    container.appendChild(section);
  }

  // 새 소설 추가 섹션
  const addSection = document.createElement('div');
  addSection.className = 'novel-section';
  addSection.innerHTML = `
    <div class="entry-row">
      <input class="entry-jp" placeholder="소설 코드 (예: n1234ab)" id="new-novel-code">
      <button class="btn-add" id="add-novel-btn">새 소설 추가</button>
    </div>
  `;
  container.appendChild(addSection);
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
function escapeAttr(s) {
  return s.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// 이벤트 위임
container.addEventListener('click', async (e) => {
  const btn = e.target;

  // 용어 삭제
  if (btn.classList.contains('btn-delete') && btn.dataset.novel && btn.dataset.jp) {
    const result = await chrome.storage.local.get({ glossaries: {} });
    delete result.glossaries[btn.dataset.novel]?.[btn.dataset.jp];
    await chrome.storage.local.set({ glossaries: result.glossaries });
    showStatus('삭제됨');
    loadAll();
  }

  // 소설 용어집 전체 삭제
  if (btn.classList.contains('btn-delete-novel') && btn.dataset.novel) {
    if (!confirm(`"${btn.dataset.novel}" 용어집을 전부 삭제할까요?`)) return;
    const result = await chrome.storage.local.get({ glossaries: {} });
    delete result.glossaries[btn.dataset.novel];
    await chrome.storage.local.set({ glossaries: result.glossaries });
    showStatus('소설 용어집 삭제됨');
    loadAll();
  }

  // 용어 추가
  if (btn.dataset.addNovel) {
    const code = btn.dataset.addNovel;
    const jpInput = container.querySelector(`[data-new-jp="${CSS.escape(code)}"]`);
    const krInput = container.querySelector(`[data-new-kr="${CSS.escape(code)}"]`);
    const jp = jpInput?.value.trim();
    const kr = krInput?.value.trim();
    if (!jp || !kr) return;

    const result = await chrome.storage.local.get({ glossaries: {} });
    if (!result.glossaries[code]) result.glossaries[code] = {};
    result.glossaries[code][jp] = kr;
    await chrome.storage.local.set({ glossaries: result.glossaries });
    showStatus('추가됨');
    loadAll();
  }

  // 새 소설 추가
  if (btn.id === 'add-novel-btn') {
    const code = document.getElementById('new-novel-code')?.value.trim();
    if (!code) return;
    const result = await chrome.storage.local.get({ glossaries: {} });
    if (!result.glossaries[code]) {
      result.glossaries[code] = {};
      await chrome.storage.local.set({ glossaries: result.glossaries });
      showStatus('소설 추가됨');
      loadAll();
    }
  }
});

// 번역 수정 시 자동 저장
container.addEventListener('change', async (e) => {
  const input = e.target;
  if (input.dataset.novel && input.dataset.jp && input.classList.contains('entry-kr')) {
    const result = await chrome.storage.local.get({ glossaries: {} });
    if (result.glossaries[input.dataset.novel]) {
      result.glossaries[input.dataset.novel][input.dataset.jp] = input.value.trim();
      await chrome.storage.local.set({ glossaries: result.glossaries });
      showStatus('수정됨');
    }
  }
});

loadAll();
