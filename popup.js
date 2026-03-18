document.addEventListener('DOMContentLoaded', () => {
  const targetLangSelect = document.getElementById('targetLang');
  const statusEl = document.getElementById('status');
  
  // 저장된 설정 불러오기
  chrome.storage.sync.get(['targetLang'], (result) => {
    if (result.targetLang) {
      targetLangSelect.value = result.targetLang;
    }
  });
  
  // 언어 변경 시 저장
  targetLangSelect.addEventListener('change', () => {
    const targetLang = targetLangSelect.value;
    
    chrome.storage.sync.set({ targetLang }, () => {
      // 저장 완료 표시
      statusEl.classList.add('show');
      setTimeout(() => {
        statusEl.classList.remove('show');
      }, 2000);
    });
  });
});
