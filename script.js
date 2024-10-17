// public/script.js
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message');
const sendButton = document.getElementById('send');

const socket = new WebSocket('ws://localhost:3000');

document.addEventListener('DOMContentLoaded', function() {
    const nicknameInput = document.getElementById('nickname');
    const setNicknameButton = document.getElementById('set-nickname');
    const nicknameContainer = document.getElementById('nickname-container');
    const chatContainer = document.getElementById('chat-container');
    document.getElementById('nickname').focus();
    // Function to set a cookie
    function setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        const cookieValue = name + "=" + (value || "") + expires + "; path=/";
        document.cookie = cookieValue;
        console.log('Cookie string set:', cookieValue); // Debugging
    }

    // Function to get a cookie
    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for(let i=0;i < ca.length;i++) {
            let c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1,c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
        }
        return null;
    }

    // Check if the nickname cookie exists and set the UI accordingly
    const nickname = getCookie('nickname');
    if (nickname) {
        nicknameContainer.style.display = 'none';
        chatContainer.style.display = 'block';
    } else {
        nicknameContainer.style.display = 'block';
        chatContainer.style.display = 'none';
    }

// Function to handle setting the nickname
function setNickname() {
    const nickname = document.getElementById('nickname').value.trim();
    console.log('Setting nickname:', nickname); // Debugging
    if (nickname) {
        setCookie('nickname', nickname, 7);
        console.log('Cookie set:', document.cookie); // Debugging
        // Update UI or redirect user
        window.location.reload();
    } else {
        console.log('Nickname is empty, not setting cookie.'); // Debugging
    }
}

// Event listener for the Set Nickname button
document.getElementById('ok').addEventListener('click', setNickname);

// Event listener for the Enter key in the nickname input
document.getElementById('nickname').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent the default action (form submission, etc.)
        setNickname(); // Call the setNickname function when Enter is pressed
    }
});

// Move the appendMessage function outside
const appendMessage = (messageData) => {
    // Parse the incoming message data if it's a JSON string
    let parsedData;
    try {
        parsedData = JSON.parse(messageData);
    } catch (e) {
        console.error('Error parsing message data:', e);
        return; // Exit the function if parsing fails
    }

    const senderNickname = parsedData.nickname;
    const messageContent = parsedData.content;

    const now = new Date();
    // Manually format the date and time
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
    const year = now.getFullYear();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    hours = hours.toString().padStart(2, '0');

    const fullTimestamp = `${day}/${month}/${year} - ${hours}:${minutes} ${ampm}`;
    const currentTime = `${hours}:${minutes} ${ampm}`;

    const messageElement = document.createElement('div');
    const timestampSpan = document.createElement('span');
    timestampSpan.className = 'timestamp';
    timestampSpan.textContent = currentTime;
    // Set the full timestamp as the title for the tooltip
    timestampSpan.title = fullTimestamp;
    messageElement.appendChild(timestampSpan);
    // Append the sender's nickname and message content
    messageElement.append(` | ${senderNickname}: ${messageContent}`);
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll to the bottom
};

socket.addEventListener('message', (event) => {
    // Handle incoming messages as before
    if (event.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = function() {
            appendMessage(reader.result); // Use the text result from the Blob
        };
        reader.readAsText(event.data);
    } else {
        appendMessage(event.data);
    }
});

// The second socket message listener
socket.addEventListener('message', (event) => {
    if (event.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = function() {
            const data = JSON.parse(reader.result);
            if (data.type === 'history') {
                messagesDiv.innerHTML = '';
                data.data.forEach((messageData) => {
                    appendMessage(JSON.stringify(messageData));
                });
            } else if (data.type === 'message') {
                appendMessage(JSON.stringify(data.data));
            }
        };
        reader.readAsText(event.data);
    } else {
        const data = JSON.parse(event.data);
        if (data.type === 'history') {
            messagesDiv.innerHTML = '';
            data.data.forEach((messageData) => {
                appendMessage(JSON.stringify(messageData));
            });
        } else if (data.type === 'message') {
            appendMessage(JSON.stringify(data.data));
        }
    }
});
sendButton.addEventListener('click', () => {
    const message = messageInput.value.trim();
    const nickname = getCookie('nickname'); // Retrieve the nickname from the cookie
    if (message) {
        const messageObject = {
            nickname: nickname,
            content: message
        };
        socket.send(JSON.stringify(messageObject)); // Send the message as a JSON object
        messageInput.value = '';
    }
});

messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendButton.click(); // Simulate button click on Enter
    }
});

nicknameInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        setNicknameButton.click(); // Simulate button click on Enter
    }
});

socket.addEventListener('message', (event) => {
    // Check if the received data is a Blob
    if (event.data instanceof Blob) {
      // Create a FileReader to read the Blob as text
      const reader = new FileReader();
      reader.onload = function() {
        // Now that we have the text, we can parse it as JSON
        const data = JSON.parse(reader.result);
  
        if (data.type === 'history') {
          // Clear the current messages
          messagesDiv.innerHTML = '';
          // Append each message from the history
          data.data.forEach((messageData) => {
            appendMessage(JSON.stringify(messageData));
          });
        } else if (data.type === 'message') {
          // Append the new message
          appendMessage(JSON.stringify(data.data));
        }
      };
      reader.readAsText(event.data); // Read the Blob as text
    } else {
      // If the data is already in JSON format, parse it directly
      const data = JSON.parse(event.data);
  
      if (data.type === 'history') {
        // Clear the current messages
        messagesDiv.innerHTML = '';
        // Append each message from the history
        data.data.forEach((messageData) => {
          appendMessage(JSON.stringify(messageData));
        });
      } else if (data.type === 'message') {
        // Append the new message
        appendMessage(JSON.stringify(data.data));
      }
    }
  });
});