// public/script.js
document.addEventListener('DOMContentLoaded', function() {
    // UI elements
    const messagesDiv = document.getElementById('messages');
    const messageInput = document.getElementById('message');
    const sendButton = document.getElementById('send');
    const nicknameInput = document.getElementById('nickname');
    const setNicknameButton = document.getElementById('ok');
    const nicknameContainer = document.getElementById('nickname-container');
    const chatContainer = document.getElementById('chat-container');
    const topicContainer = document.getElementById('topic');
    const dbbutton = document.getElementById('clear-db');   
    // Create a virtual form and append the message input to it
    const virtualForm = document.createElement('form');
    virtualForm.appendChild(messageInput);
    document.body.appendChild(virtualForm);

    // Listen for the submit event on the virtual form
    virtualForm.addEventListener('submit', (event) => {
        event.preventDefault(); // This will prevent the actual form submission
        sendButton.click(); // Trigger the click event on the send button programmatically
    });

        // Prevent default form submission behavior when the "Send" button is clicked
        sendButton.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent any default action
            const messageContent = messageInput.value.trim();
            const nickname = getCookie('nickname'); // Retrieve the nickname from the cookie
            if (messageContent && nickname) {
                const messageObject = {
                    nickname: nickname,
                    content: messageContent
                };
                console.log('Sending message:', messageObject); // Log the message object
                socket.send(JSON.stringify(messageObject)); // Send the message as a JSON object
                messageInput.value = ''; // Clear the input field after sending
                messageInput.focus(); // Keep the focus on the input after sending
            } else {
                console.error('Nickname or message content is missing');
            }
        });

    // Initialize WebSocket connection
    const socket = new WebSocket('ws://localhost:3000');

    // Utility functions for cookie management
    function setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    }

    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    // Display the appropriate UI based on nickname presence
    const nickname = getCookie('nickname');
    if (nickname) {
        nicknameContainer.style.display = 'none';
        chatContainer.style.display = 'block';
        topicContainer.style.display = 'block';
        messageInput.style.display = 'block';
        dbbutton.style.display = 'block';
    } else {
        nicknameContainer.style.display = 'block';
        chatContainer.style.display = 'none';
        topicContainer.style.display = 'none';
        messageInput.style.display = 'none';
        dbbutton.style.display = 'none';
        nicknameInput.focus();
    }

    // Set nickname and update UI
    function setNickname() {
        const nickname = nicknameInput.value.trim();
        if (nickname) {
            setCookie('nickname', nickname, 7);
            nicknameContainer.style.display = 'none'; // Hide nickname input
            chatContainer.style.display = 'block'; // Show chat container
            messageInput.focus(); // Focus on the message input
            dbbutton.style.display = 'block';
            messageInput.style.display = 'block';
            topicContainer.style.display = 'block';
        }
    }

    // Event listeners for UI interactions
    setNicknameButton.addEventListener('click', setNickname);

    // Event listener for the Enter key in the nickname input
    nicknameInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            setNickname();
        }
    });

    // Append messages to the chat
function appendMessage(messageData) {
    // Check if messageData has the required properties
    if (messageData && messageData.nickname && messageData.content && messageData.timestamp) {
        // Create a new div element for each message
        const messageElement = document.createElement('div');
        messageElement.className = 'message'; // Add a class for styling

        // Create a span for the message text
        const messageTextSpan = document.createElement('span');
        messageTextSpan.className = 'message-text';
        messageTextSpan.textContent = `${messageData.nickname}: ${messageData.content}`;

        // Create a span for the timestamp
        const timestampSpan = document.createElement('span');
        timestampSpan.className = 'message-timestamp';

        // Format the timestamp
        const timestamp = new Date(messageData.timestamp);
        const timeString = isNaN(timestamp.getTime()) ? 'Invalid timestamp' : timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        const fullTimestamp = isNaN(timestamp.getTime()) ? 'Invalid timestamp' : timestamp.toLocaleString();

        // Set the time and full timestamp
        timestampSpan.textContent = timeString;
        timestampSpan.title = fullTimestamp; // The full timestamp will be shown on hover

        // Append the message text and timestamp to the message element
        messageElement.appendChild(messageTextSpan);
        messageElement.appendChild(timestampSpan);

        // Append the message element to the messages container
        messagesDiv.appendChild(messageElement);

        // Scroll to the last message
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } else {
        console.error('Invalid message data:', messageData);
    }
}

// Modify the processMessageData function to handle history type correctly
function processMessageData(data) {
    if (data.type === 'history') {
        // Clear the current messages
        messagesDiv.innerHTML = '';
        // Append each message from the history individually
        data.data.forEach((messageData) => {
            appendMessage(messageData); // Pass the individual message object
        });
    } else if (data.type === 'message') {
        // Append the new message
        appendMessage(data.data); // data.data should be the individual message object
    }
}
    // Send message
    sendButton.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent any default action
        const messageContent = messageInput.value.trim();
        const nickname = getCookie('nickname'); // Retrieve the nickname from the cookie
        if (messageContent && nickname) {
            const messageObject = {
                nickname: nickname,
                content: messageContent
            };
            socket.send(JSON.stringify(messageObject)); // Send the message as a JSON object
            messageInput.value = ''; // Clear the input field after sending
            messageInput.focus(); // Keep the focus on the input after sending
        }
    });

    messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent any default action, such as form submission
            sendButton.click(); // Trigger the click event on the send button programmatically
        }
    });

    // Handle incoming WebSocket messages
    socket.addEventListener('message', (event) => {
        let data;
        if (event.data instanceof Blob) {
            const reader = new FileReader();
            reader.onload = () => {
                data = JSON.parse(reader.result);
                processMessageData(data); // Correctly handle the parsed data
            };
            reader.readAsText(event.data);
        } else {
            data = JSON.parse(event.data);
            processMessageData(data); // Correctly handle the parsed data
        }
    });
});
