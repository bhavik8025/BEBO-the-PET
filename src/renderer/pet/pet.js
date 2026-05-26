const petButton = document.getElementById('pet-button');
const petCharacter = document.getElementById('pet-character');
const speechBubble = document.getElementById('speech-bubble');

let currentState = 'idle';
let bubbleTimer = null;
let hoverBubbleActive = false;
let isDragging = false;
let didDrag = false;
let dragOffsetX = 90;
let dragOffsetY = 110;

function setState(state, durationMs) {
  currentState = state || 'idle';
  petCharacter.className = `pet-${currentState}`;

  if (durationMs) {
    window.setTimeout(() => setState('idle'), durationMs);
  }
}

function showBubble(text, autoHideMs = 0, source = 'system') {
  if (source !== 'hover') hoverBubbleActive = false;
  speechBubble.textContent = text || '';
  speechBubble.classList.toggle('visible', Boolean(text));

  if (bubbleTimer) window.clearTimeout(bubbleTimer);
  if (autoHideMs > 0) {
    bubbleTimer = window.setTimeout(() => {
      speechBubble.classList.remove('visible');
    }, autoHideMs);
  }
}

petButton.addEventListener('mouseenter', () => {
  if (!isDragging) {
    hoverBubbleActive = true;
    showBubble('BEBO', 0, 'hover');
    window.petAPI.hovered(true);
  }
});

petButton.addEventListener('mouseleave', () => {
  if (!isDragging) {
    window.petAPI.hovered(false);
    if (hoverBubbleActive) {
      hoverBubbleActive = false;
      showBubble('');
    }
  }
});

petButton.addEventListener('mousedown', (event) => {
  if (event.button !== 0) return;
  isDragging = true;
  didDrag = false;
  dragOffsetX = event.clientX;
  dragOffsetY = event.clientY;
  window.petAPI.dragStarted();
});

window.addEventListener('mousemove', (event) => {
  if (!isDragging) return;
  didDrag = true;
  window.petAPI.dragged({
    x: event.screenX - dragOffsetX,
    y: event.screenY - dragOffsetY
  });
});

window.addEventListener('mouseup', () => {
  if (!isDragging) return;
  isDragging = false;
  window.petAPI.dragEnded();
});

petButton.addEventListener('click', () => {
  if (didDrag) return;
  window.petAPI.clicked();
});

petButton.addEventListener('dblclick', () => {
  window.petAPI.doubleClicked();
});

petButton.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  window.petAPI.rightClicked();
});

window.petAPI.onSetState(({ state, durationMs }) => setState(state, durationMs));
window.petAPI.onShowBubble(({ text, autoHideMs }) => showBubble(text, autoHideMs));
window.petAPI.onHideBubble(() => showBubble(''));

setState('idle');
