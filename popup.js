const $ = (id) => document.getElementById(id);

// 설정 로드
chrome.storage.sync.get(
  {
    apiKey: '',
    model: 'gemini-3.1-flash-lite-preview',
    temperature: 0.3,
    autoTranslate: false,
  },
  (settings) => {
    $('apiKey').value = settings.apiKey;
    $('model').value = settings.model;
    $('temperature').value = settings.temperature;
    $('tempValue').textContent = settings.temperature;
    $('autoTranslate').checked = settings.autoTranslate;
  }
);

$('temperature').addEventListener('input', (e) => {
  $('tempValue').textContent = e.target.value;
});

$('saveBtn').addEventListener('click', () => {
  const settings = {
    apiKey: $('apiKey').value.trim(),
    model: $('model').value,
    temperature: parseFloat($('temperature').value),
    autoTranslate: $('autoTranslate').checked,
  };

  chrome.storage.sync.set(settings, () => {
    $('status').textContent = '저장되었습니다';
    setTimeout(() => ($('status').textContent = ''), 2000);
  });
});

$('clearCacheBtn').addEventListener('click', async () => {
  const all = await chrome.storage.local.get(null);
  const cacheKeys = Object.keys(all).filter((k) => k.startsWith('cache_'));
  await chrome.storage.local.remove(cacheKeys);
  $('status').textContent = `${cacheKeys.length}개 캐시 삭제됨`;
  setTimeout(() => ($('status').textContent = ''), 2000);
});

$('optionsBtn').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});
