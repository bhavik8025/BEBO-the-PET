const petWrap = document.getElementById('pet-wrap');
const petButton = document.getElementById('pet-button');
// Expressions are applied to the wrapper, not the <img>, so the eyelids drawn
// over the avatar move with it.
const petBody = document.getElementById('pet-body');
const speechBubble = document.getElementById('speech-bubble');

let currentState = 'idle';
let bubbleTimer = null;
let hoverBubbleActive = false;
let isDragging = false;
let didDrag = false;
let dragOffsetX = 90;
let dragOffsetY = 110;

let returnTimer = null;

function setState(state, durationMs) {
  currentState = state || 'idle';

  if (returnTimer) {
    window.clearTimeout(returnTimer);
    returnTimer = null;
  }

  // Re-trigger even when the state is unchanged: one-shot animations would
  // otherwise sit finished and never replay.
  petBody.className = '';
  void petBody.offsetWidth;               // force reflow
  petBody.className = `pet-${currentState}`;

  // Drives the effect layer (z z z, sparkles, ?, sweat drop) in pet.css.
  petWrap.dataset.fx = currentState;

  if (durationMs) {
    returnTimer = window.setTimeout(() => setState('idle'), durationMs);
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

/* Click-through hit testing lives in the main process (ipc-router). Doing it
   here would rely on setIgnoreMouseEvents({ forward: true }) delivering
   mousemove to the renderer, which proved unreliable in testing: no events
   arrived, so the window never became clickable again. Polling the global
   cursor position in main does not depend on event forwarding at all. */

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

/* Dragging uses pointer events with capture, not mouse events.
   BUG FIX: the window is 132x148 and only moves once per dragged() round trip,
   so a quick drag lets the cursor outrun it. With plain mouse events the
   mouseup then landed on whatever window was underneath, this renderer never
   saw it, and the drag never ended: isDragging stayed true, main stayed in
   "dragging" so it froze the click-through state, and didDrag stayed true so
   every later click was swallowed. The pet ended up parked mid-screen,
   unclickable and undraggable. setPointerCapture guarantees we still receive
   pointerup wherever the cursor has got to. */
const DRAG_THRESHOLD = 4;          // px of travel before a press is a drag
let dragPointerId = null;
let pressScreenX = 0;
let pressScreenY = 0;

function endDrag() {
  if (!isDragging) return;
  if (dragPointerId !== null) {
    try { petButton.releasePointerCapture(dragPointerId); } catch (_) {}
    dragPointerId = null;
  }
  isDragging = false;
  window.petAPI.dragEnded();
}

petButton.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return;
  dragPointerId = event.pointerId;
  try { petButton.setPointerCapture(event.pointerId); } catch (_) {}
  isDragging = true;
  didDrag = false;
  pressScreenX = event.screenX;
  pressScreenY = event.screenY;
  dragOffsetX = event.clientX;
  dragOffsetY = event.clientY;
  window.petAPI.dragStarted();
});

petButton.addEventListener('pointermove', (event) => {
  if (!isDragging || event.pointerId !== dragPointerId) return;
  if (!didDrag) {
    // A click with a bit of hand tremor is still a click. Previously any
    // movement at all set didDrag, so a slightly shaky click did nothing.
    if (Math.abs(event.screenX - pressScreenX) < DRAG_THRESHOLD &&
        Math.abs(event.screenY - pressScreenY) < DRAG_THRESHOLD) return;
    didDrag = true;
  }
  window.petAPI.dragged({
    x: event.screenX - dragOffsetX,
    y: event.screenY - dragOffsetY
  });
});

petButton.addEventListener('pointerup', endDrag);
petButton.addEventListener('pointercancel', endDrag);
window.addEventListener('blur', endDrag);

petButton.addEventListener('click', () => {
  if (didDrag) {
    didDrag = false;      // never let a stale drag swallow the next click too
    return;
  }
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
