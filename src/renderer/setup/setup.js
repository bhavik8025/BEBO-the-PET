const input    = document.getElementById('key-input');
const verifyBtn = document.getElementById('verify-btn');
const cancelBtn = document.getElementById('cancel-btn');
const closeBtn  = document.getElementById('close-btn');
const status    = document.getElementById('status');
const groqLink  = document.getElementById('groq-link');

// Enable verify button only when input looks like a Groq key
input.addEventListener('input', () => {
  const val = input.value.trim();
  verifyBtn.disabled = val.length < 20;
  input.classList.remove('valid', 'error');
  status.textContent = '';
  status.className = 'status';
});

// Open Groq console in default browser
groqLink.addEventListener('click', () => {
  window.setupAPI.openGroq();
});

// Cancel / close — quits
cancelBtn.addEventListener('click', () => window.close());
closeBtn.addEventListener('click', () => window.close());

// Verify key
verifyBtn.addEventListener('click', async () => {
  const key = input.value.trim();
  if (!key) return;

  verifyBtn.disabled = true;
  verifyBtn.textContent = 'Checking...';
  status.textContent = 'Validating your key with Groq...';
  status.className = 'status checking';
  input.classList.remove('valid', 'error');

  try {
    const result = await window.setupAPI.validateKey(key);

    if (result.ok) {
      input.classList.add('valid');
      status.textContent = 'Key verified! Launching BEBO...';
      status.className = 'status ok';
      verifyBtn.textContent = 'Launching...';

      await window.setupAPI.saveKey(key);
    } else {
      input.classList.add('error');
      status.textContent = result.error || 'Invalid key. Double-check and try again.';
      status.className = 'status err';
      verifyBtn.disabled = false;
      verifyBtn.textContent = 'Verify & Launch';
    }
  } catch (err) {
    input.classList.add('error');
    status.textContent = 'Network error. Check your connection and try again.';
    status.className = 'status err';
    verifyBtn.disabled = false;
    verifyBtn.textContent = 'Verify & Launch';
  }
});
