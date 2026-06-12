// content.js - 소설가가되자 페이지에서 번역 UI 삽입 및 관리

(function () {
  'use strict';

  // URL에서 소설 코드와 챕터 번호 추출
  const pathMatch = location.pathname.match(/^\/(n[a-z0-9]+)\/(\d+)\/?$/);
  if (!pathMatch) return;

  const novelCode = pathMatch[1];
  const chapterNum = pathMatch[2];

  // 텍스트 컨테이너 찾기 - 전서/본문/후기 모두 수집
  const allContainers = Array.from(
    document.querySelectorAll('.js-novel-text, .p-novel__text, #novel_honbun')
  );

  if (allContainers.length === 0) {
    console.error('[Narou Translator] 본문 컨테이너를 찾을 수 없습니다.');
    return;
  }

  console.log('[Narou Translator] 초기화:', novelCode, '챕터', chapterNum);
  console.log('[Narou Translator] 컨테이너 수:', allContainers.length,
    allContainers.map(c => c.className).join(' | '));

  // ── 상태 ──
  const originalHTMLs = new Map(); // 컨테이너별 원문 HTML 백업
  let translationText = null;      // 번역 결과 텍스트
  let isTranslated = false;
  let isTranslating = false;

  // ── 유틸 ──
  function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }

  // ── 플로팅 버튼 ──
  function createUI() {
    const fab = document.createElement('div');
    fab.id = 'nt-fab';
    fab.innerHTML = `
      <button id="nt-btn-translate" title="번역하기">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 19l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/>
        </svg>
        <span class="nt-btn-label">번역</span>
      </button>
      <button id="nt-btn-toggle" title="원문/번역 전환" class="nt-hidden">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>
        </svg>
      </button>
      <button id="nt-btn-extract" title="이름 추출">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v-2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M20 8v6m3-3h-6"/>
        </svg>
      </button>
    `;
    document.body.appendChild(fab);

    // 오버레이
    const overlay = document.createElement('div');
    overlay.id = 'nt-overlay';
    overlay.innerHTML = `
      <div class="nt-overlay-box">
        <div class="nt-spinner"></div>
        <div id="nt-overlay-msg">번역 중...</div>
        <div id="nt-overlay-sub"></div>
      </div>
    `;
    document.body.appendChild(overlay);

    // 토스트
    const toast = document.createElement('div');
    toast.id = 'nt-toast';
    document.body.appendChild(toast);
  }

  function showOverlay(msg, sub) {
    const ol = document.getElementById('nt-overlay');
    document.getElementById('nt-overlay-msg').textContent = msg;
    document.getElementById('nt-overlay-sub').textContent = sub || '';
    ol.classList.add('show');
  }

  function hideOverlay() {
    document.getElementById('nt-overlay')?.classList.remove('show');
  }

  function showToast(msg, ms = 3000) {
    const t = document.getElementById('nt-toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), ms);
  }

  // ── 텍스트 추출 (모든 컨테이너) ──
  function extractText() {
    const sections = [];
    for (const container of allContainers) {
      const paragraphs = container.querySelectorAll('p');
      const lines = [];
      for (const p of paragraphs) {
        const t = p.textContent.trim();
        if (t.length > 0) lines.push(t);
      }
      if (lines.length > 0) sections.push(lines.join('\n'));
    }
    const result = sections.join('\n\n---\n\n');
    console.log('[Narou Translator] 추출된 텍스트 길이:', result.length,
      '섹션 수:', sections.length);
    return result;
  }

  // ── 번역 적용: 원문 HTML을 번역문으로 교체 ──
  function applyTranslation(translation) {
    console.log('[Narou Translator] applyTranslation 호출, 번역 길이:', translation.length);

    // 원문 백업 (최초 1회)
    if (originalHTMLs.size === 0) {
      for (const container of allContainers) {
        originalHTMLs.set(container, container.innerHTML);
      }
      console.log('[Narou Translator] 원문 백업 완료, 컨테이너 수:', originalHTMLs.size);
    }

    // 구분자(---)로 섹션 분리 → 각 컨테이너에 매핑
    const sections = translation.split(/\n*---\n*/);

    for (let i = 0; i < allContainers.length; i++) {
      const section = sections[i] || '';
      const lines = section.split('\n');
      const htmlParts = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === '') {
          htmlParts.push('<p><br></p>');
        } else {
          htmlParts.push('<p>' + escapeHtml(trimmed) + '</p>');
        }
      }
      allContainers[i].innerHTML = htmlParts.join('');
    }

    isTranslated = true;
    console.log('[Narou Translator] DOM 교체 완료, 컨테이너 수:', allContainers.length);
  }

  function restoreOriginal() {
    if (originalHTMLs.size > 0) {
      for (const [container, html] of originalHTMLs) {
        container.innerHTML = html;
      }
      isTranslated = false;
      console.log('[Narou Translator] 원문 복원 완료');
    }
  }

  // ── 번역 실행 ──
  async function doTranslate() {
    if (isTranslating) return;
    isTranslating = true;

    const btn = document.getElementById('nt-btn-translate');
    btn.classList.add('loading');
    btn.querySelector('.nt-btn-label').textContent = '번역 중...';
    showOverlay('번역 중...', 'Gemini 3.1 응답 대기 중');

    try {
      const text = extractText();
      if (!text || text.length === 0) {
        showToast('본문을 찾을 수 없습니다.', 5000);
        return;
      }

      showOverlay('번역 중...', text.length + '자 전송됨 — 응답 대기 중');

      console.log('[Narou Translator] API 요청 전송, 텍스트 길이:', text.length);

      const response = await chrome.runtime.sendMessage({
        type: 'translate',
        text: text,
        novelCode: novelCode,
        chapterNum: chapterNum,
      });

      console.log('[Narou Translator] API 응답:', JSON.stringify(response).slice(0, 200));

      if (!response) {
        showToast('응답이 없습니다. 서비스 워커를 확인해주세요.', 5000);
        return;
      }

      if (response.success) {
        if (!response.translation || response.translation.trim().length === 0) {
          showToast('번역 결과가 비어있습니다.', 5000);
          console.error('[Narou Translator] 빈 번역 결과:', response);
          return;
        }

        translationText = response.translation;
        console.log('[Narou Translator] 번역 텍스트 미리보기:', translationText.slice(0, 100));

        applyTranslation(translationText);

        document.getElementById('nt-btn-toggle').classList.remove('nt-hidden');
        showToast(response.fromCache ? '캐시에서 로드됨' : '번역 완료!');
      } else {
        showToast('오류: ' + response.error, 5000);
        console.error('[Narou Translator] 번역 오류:', response.error);
      }
    } catch (err) {
      showToast('오류: ' + err.message, 5000);
      console.error('[Narou Translator] 예외:', err);
    } finally {
      btn.classList.remove('loading');
      btn.querySelector('.nt-btn-label').textContent = '번역';
      hideOverlay();
      isTranslating = false;
    }
  }

  // ── 이름 추출 ──
  async function doExtractNames() {
    showOverlay('이름 추출 중...', '고유명사 분석 중');

    try {
      const text = extractText();
      const response = await chrome.runtime.sendMessage({
        type: 'extractNames',
        text: text.slice(0, 5000),
        novelCode: novelCode,
      });

      hideOverlay();

      if (response.success && response.names && response.names.length > 0) {
        showNameDialog(response.names);
      } else if (response.success) {
        showToast('새로운 고유명사를 찾지 못했습니다.');
      } else {
        showToast('오류: ' + response.error, 5000);
      }
    } catch (err) {
      hideOverlay();
      showToast('오류: ' + err.message, 5000);
    }
  }

  // ── 이름 등록 다이얼로그 ──
  function showNameDialog(names) {
    document.getElementById('nt-name-dialog')?.remove();

    const dialog = document.createElement('div');
    dialog.id = 'nt-name-dialog';
    dialog.innerHTML = `
      <div class="nt-dialog-overlay">
        <div class="nt-dialog-content">
          <h3>추출된 고유명사</h3>
          <p class="nt-dialog-desc">체크한 항목이 용어집에 저장됩니다.</p>
          <div class="nt-name-list">
            ${names.map((n, i) => `
              <div class="nt-name-row">
                <input type="checkbox" id="nt-name-${i}" checked>
                <label for="nt-name-${i}">
                  <span class="nt-name-jp">${escapeHtml(n.jp)}</span>
                  <span class="nt-name-type">${n.type}</span>
                </label>
                <input type="text" class="nt-name-kr" value="${escapeHtml(n.kr)}" data-idx="${i}">
              </div>
            `).join('')}
          </div>
          <div class="nt-dialog-buttons">
            <button id="nt-name-save">저장</button>
            <button id="nt-name-cancel">취소</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    dialog.querySelector('#nt-name-save').addEventListener('click', async () => {
      let count = 0;
      for (let i = 0; i < names.length; i++) {
        const cb = dialog.querySelector('#nt-name-' + i);
        const input = dialog.querySelector('.nt-name-kr[data-idx="' + i + '"]');
        if (cb && cb.checked && input && input.value.trim()) {
          await Glossary.addEntry(novelCode, names[i].jp, input.value.trim());
          count++;
        }
      }
      showToast(count + '개 용어 저장됨');
      dialog.remove();
    });

    dialog.querySelector('#nt-name-cancel').addEventListener('click', () => dialog.remove());
  }

  // ── 초기화 ──
  createUI();

  document.getElementById('nt-btn-translate').addEventListener('click', doTranslate);
  document.getElementById('nt-btn-extract').addEventListener('click', doExtractNames);
  document.getElementById('nt-btn-toggle').addEventListener('click', () => {
    if (isTranslated) {
      restoreOriginal();
      showToast('원문 표시');
    } else if (translationText) {
      applyTranslation(translationText);
      showToast('번역 표시');
    }
  });

  // 자동 번역
  chrome.storage.sync.get({ autoTranslate: false }, (result) => {
    if (result.autoTranslate) doTranslate();
  });
})();
