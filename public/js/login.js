document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const messageBox = document.getElementById('login-message');

  if (!form) return;

  function showMessage(text) {
    messageBox.textContent = text;
    messageBox.style.display = 'block';
  }

  function clearMessage() {
    messageBox.textContent = '';
    messageBox.style.display = 'none';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessage();

    const email = document.getElementById('email').value.trim();

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        showMessage(result.message || 'Unable to log in.');
        return;
      }

      window.location.href = 'browse.html';
    } catch (error) {
      console.error('Error logging in:', error);
      showMessage('Something went wrong. Please try again.');
    }
  });
});
