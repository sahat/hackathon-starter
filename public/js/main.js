/* eslint-env jquery, browser */
$(document).ready(() => {
  // Place JavaScript code here...
});
function init() {
  const form = document.getElementById('form-container');
  const input = document.getElementById('message');
  const submit = document.getElementById('submit');
  const messages = document.getElementById('messages');

  const socket = io.connect('http://localhost:3001');

  socket.on('message', (data) => {
    if (data.message) {
      messages.innerHTML += `<br>${data.message}`;
    } else {
      console.log('There is a problem:', data);
    }
  });

  submit.onclick = () => {
    if (input.value !== '') {
      socket.emit('send', { message: input.value });
      input.value = '';
    }
  };
}
