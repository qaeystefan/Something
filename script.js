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
    const clearButton = document.getElementById('clearButton'); // Add this line
    const onlineUsersDiv = document.getElementById('online-users'); // Add this line

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

    // Function to update the UI based on the nickname
    function updateUIBasedOnNickname() {
        const nickname = getCookie('nickname');
        if (nickname) {
            nicknameContainer.style.display = 'none';
            chatContainer.style.display = 'block';
            topicContainer.style.display = 'block';
            messageInput.style.display = 'block';
            // Check if the nickname contains "*"
            if (nickname.includes("*")) {
                clearButton.style.display = 'block'; // Show the clear button
            } else {
                clearButton.style.display = 'none'; // Hide the clear button
            }
        } else {
            nicknameContainer.style.display = 'block';
            chatContainer.style.display = 'none';
            topicContainer.style.display = 'none';
            messageInput.style.display = 'none';
            clearButton.style.display = 'none'; // Add this line
            nicknameInput.focus();
        }
    }

    // Set nickname and update UI
    function setNickname() {
        const nickname = nicknameInput.value.trim();
        if (nickname) {
            setCookie('nickname', nickname, 7);
            updateUIBasedOnNickname(); // Update the UI based on the nickname
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

    // Call the function to update the UI based on the nickname when the page loads
    updateUIBasedOnNickname();

    // Append messages to the chat
    function appendMessage(messageData) {
        // Check if messageData has the required properties
        if (messageData && messageData.nickname && messageData.content && messageData.timestamp) {
            // Create a new div element for each message
            const messageElement = document.createElement('div');
            messageElement.className = 'message'; // Add a class for styling

            // Create a span for the nickname
            const nicknameSpan = document.createElement('span');
            nicknameSpan.className = 'message-text';
            nicknameSpan.textContent = `${messageData.nickname}: `;

            // Highlight the nickname if it matches the cookie
            const nickname = getCookie('nickname');
            if (messageData.nickname === nickname) {
                nicknameSpan.classList.add('highlight-nickname');
            }

            // Create a span for the message content
            const messageContentSpan = document.createElement('span');
            messageContentSpan.className = 'message-text';
            messageContentSpan.textContent = messageData.content;

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

            // Append the nickname, message content, and timestamp to the message element
            messageElement.appendChild(nicknameSpan);
            messageElement.appendChild(messageContentSpan);
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
        } else if (data.type === 'onlineUsers') { // Add this block
            onlineUsersDiv.textContent = `Online users: ${data.data}`;
        } else if (data.type === 'refreshChat') { // Add this block
            messagesDiv.innerHTML = ''; // Clear the chat display
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

    // Add event listener for the clear database button
    clearButton.addEventListener('click', () => {
        fetch('http://localhost:3000/clear-database', { method: 'POST' }) // Use full address
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(data => {
                console.log(data);
                messagesDiv.innerHTML = ''; // Clear the chat display
            })
            .catch(error => console.error('Error clearing database:', error));
    });

    // Generate more stars dynamically
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.top = Math.random() * 100 + 'vh';
        star.style.left = Math.random() * 100 + 'vw';
        star.style.animationDuration = Math.random() * 5 + 3 + 's';
        document.querySelector('.background').appendChild(star);
    }
});
