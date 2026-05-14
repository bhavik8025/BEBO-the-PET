const closeButton = document.getElementById('close-button');
const copyButton = document.getElementById('copy-button');
const output = document.getElementById('task-output');
const input = document.getElementById('task-input');

closeButton.addEventListener('click', () => {
  window.panelAPI.close();
});

document.querySelectorAll('[data-task]').forEach((button) => {
  button.addEventListener('click', () => {
    const task = button.dataset.task;
    output.textContent = task === 'explain_screen'
      ? 'Capturing your screen for BEBO...'
      : `Running ${task.replaceAll('_', ' ')}...`;
    window.panelAPI.runTask({
      type: task,
      input: input.value
    });
  });
});

copyButton.addEventListener('click', async () => {
  await navigator.clipboard.writeText(output.textContent);
  copyButton.textContent = 'Copied';
  window.setTimeout(() => {
    copyButton.textContent = 'Copy';
  }, 1200);
});

window.panelAPI.onTaskResult(({ output: result }) => {
  output.textContent = result;
});

input.addEventListener('input', () => {
  if (!input.value.trim()) return;
});
