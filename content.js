let popup = null;

// 创建翻译弹窗
function createPopup() {
  const div = document.createElement('div');
  div.className = 'translation-popup';
  div.style.display = 'none';
  document.body.appendChild(div);
  return div;
}

// 显示翻译弹窗
function showPopup(text, translation, x, y) {
  if (!popup) {
    popup = createPopup();
  }

  // 判断是句子还是单词
  const isSentence = text.split(' ').length > 1;
  
  popup.innerHTML = `
    <div class="original ${isSentence ? 'sentence' : ''}">${text}</div>
    <div class="translated ${isSentence ? 'sentence' : ''}">${translation}</div>
    <div class="controls">
      <button class="pronounce-btn">播放发音</button>
      <button class="close-btn">关闭</button>
    </div>
  `;

  // 添加事件监听器
  const pronounceBtn = popup.querySelector('.pronounce-btn');
  const closeBtn = popup.querySelector('.close-btn');

  // 清除旧的事件监听器
  if (pronounceBtn._clickHandler) {
    pronounceBtn.removeEventListener('click', pronounceBtn._clickHandler);
  }
  if (closeBtn._clickHandler) {
    closeBtn.removeEventListener('click', closeBtn._clickHandler);
  }

  // 添加新的事件监听器
  pronounceBtn._clickHandler = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };
  pronounceBtn.addEventListener('click', pronounceBtn._clickHandler);

  closeBtn._clickHandler = () => {
    popup.style.display = 'none';
  };
  closeBtn.addEventListener('click', closeBtn._clickHandler);

  // 调整弹窗位置，确保长文本不会超出屏幕
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let posX = x;
  let posY = y;
  
  if (x + popup.offsetWidth > viewportWidth) {
    posX = viewportWidth - popup.offsetWidth - 20;
  }
  
  if (y + popup.offsetHeight > viewportHeight) {
    posY = y - popup.offsetHeight - 10;
  }

  popup.style.left = `${posX}px`;
  popup.style.top = `${posY}px`;
  popup.style.display = 'block';
}

// 调用Google翻译API
async function translateText(text) {
  console.log(text);
  // 添加最大字符限制
  const MAX_LENGTH = 1000;
  if (text.length > MAX_LENGTH) {
    text = text.substring(0, MAX_LENGTH) + '...';
  }
  
  try {
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encodeURIComponent(text)}`);
    const data = await response.json();
    return data[0].map(item => item[0]).join(' ');
  } catch (error) {
    console.error('翻译出错:', error);
    return '翻译服务暂时不可用，请稍后再试';
  }
}

async function handleTextSelection(event) {
  const selection = window.getSelection();
  const text = selection.toString().trim();

  if (text) {
    try {
      const translation = await translateText(text);
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      const x = rect.left + window.scrollX;
      const y = rect.bottom + window.scrollY;

      showPopup(text, translation, x, y);
    } catch (error) {
      console.error('翻译出错:', error);
    }
  }
}

document.addEventListener('mouseup', (event) => {
  if (event.detail === 2) {
    return;
  }
  
  if (popup && popup.contains(event.target)) {
    return;
  }

  setTimeout(() => {
    handleTextSelection(event);
  }, 10);
});

document.addEventListener('dblclick', handleTextSelection);

document.addEventListener('mousedown', (event) => {
  if (popup && !popup.contains(event.target)) {
    popup.style.display = 'none';
  }
});
