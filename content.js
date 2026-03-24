// Lexi - Content Script
(function() {
  'use strict';
  
  let popup = null;
  let currentSelection = '';
  let hideTimeout = null;

  function createPopup() {
    if (popup && document.body.contains(popup)) return popup;
    
    popup = document.createElement('div');
    popup.id = 'qwt-popup';
    popup.innerHTML = `
      <div class="qwt-content">
        <div class="qwt-translation">
          <div class="qwt-loading"></div>
        </div>
      </div>
    `;
    
    document.body.appendChild(popup);
    
    popup.addEventListener('mouseenter', () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
    });
    
    popup.addEventListener('mouseleave', () => {
      scheduleHide();
    });
    
    return popup;
  }

  function scheduleHide() {
    if (hideTimeout) clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => hidePopup(), 3000);
  }

  function showPopup(x, y, text) {
    const popupEl = createPopup();
    
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
    
    popupEl.querySelector('.qwt-translation').innerHTML = '<div class="qwt-loading"></div>';
    popupEl.style.display = 'block';
    popupEl.style.opacity = '0';
    
    let posX = x;
    let posY = y - 12;
    
    const popupWidth = 240;
    if (posX - popupWidth/2 < 10) posX = popupWidth/2 + 10;
    if (posX + popupWidth/2 > window.innerWidth - 10) {
      posX = window.innerWidth - popupWidth/2 - 10;
    }
    
    popupEl.style.left = `${posX + window.scrollX}px`;
    popupEl.style.top = `${posY + window.scrollY}px`;
    
    requestAnimationFrame(() => {
      popupEl.style.opacity = '1';
    });
    
    translateText(text);
    scheduleHide();
  }

  function hidePopup() {
    if (popup) {
      popup.style.opacity = '0';
      setTimeout(() => {
        if (popup) popup.style.display = 'none';
      }, 150);
    }
    currentSelection = '';
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
  }

  async function translateText(text) {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ko&dt=t&dt=bd&dj=1&q=${encodeURIComponent(text)}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      let translationHTML = '';
      
      if (data.sentences && data.sentences.length > 0) {
        const translation = data.sentences.map(s => s.trans).join('');
        translationHTML += `<div class="qwt-main-translation">${translation}</div>`;
      }
      
      if (data.dict && data.dict.length > 0 && text.split(' ').length <= 2) {
        translationHTML += '<div class="qwt-dict">';
        data.dict.slice(0, 2).forEach(entry => {
          translationHTML += `<div class="qwt-dict-entry">`;
          translationHTML += `<span class="qwt-pos">${entry.pos}</span>`;
          translationHTML += `<span class="qwt-terms">${entry.terms.slice(0, 3).join(', ')}</span>`;
          translationHTML += `</div>`;
        });
        translationHTML += '</div>';
      }
      
      if (popup && popup.style.display !== 'none') {
        popup.querySelector('.qwt-translation').innerHTML = translationHTML || '<div class="qwt-error">번역 결과 없음</div>';
      }
      
    } catch (error) {
      if (popup && popup.style.display !== 'none') {
        popup.querySelector('.qwt-translation').innerHTML = '<div class="qwt-error">번역 실패</div>';
      }
    }
  }

  document.addEventListener('mouseup', (e) => {
    if (popup && popup.contains(e.target)) return;
    
    setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      const wordCount = selectedText.trim().split(/\s+/).length;

      if (selectedText && selectedText.length > 0 && wordCount <= 2) {
        if (selectedText !== currentSelection) {
          currentSelection = selectedText;
          showPopup(e.clientX, e.clientY, selectedText);
        }
      }
    }, 10);
  });

  document.addEventListener('mousedown', (e) => {
    if (popup && !popup.contains(e.target)) hidePopup();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hidePopup();
  });
})();
