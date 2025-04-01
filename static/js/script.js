document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const chatArea = document.getElementById('chatArea');
    const messageForm = document.getElementById('messageForm');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const modeButtons = document.querySelectorAll('.mode-btn');
    const subjectButtons = document.querySelectorAll('.subject-btn');
    const currentModeDisplay = document.getElementById('currentModeDisplay');
    const currentSubjectDisplay = document.getElementById('currentSubjectDisplay');
    
    // State variables
    let currentMode = 'trợ lý'; // Default mode
    let currentSubject = 'Toán học'; // Default subject
    
    // Initialize the chat area with any existing messages
    initializeChat();
    
    // Event listeners
    messageForm.addEventListener('submit', sendMessage);
    clearHistoryBtn.addEventListener('click', clearChatHistory);
    
    // Mode selection
    modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const mode = button.getAttribute('data-mode');
            setActiveMode(mode);
        });
    });
    
    // Subject selection
    subjectButtons.forEach(button => {
        button.addEventListener('click', () => {
            const subject = button.getAttribute('data-subject');
            setActiveSubject(subject);
        });
    });
    
    // Allow pressing Enter to send message (Shift+Enter for new line)
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(e);
        }
    });
    
    /**
     * Initialize the chat area with previous messages if any
     */
    function initializeChat() {
        // This would be replaced with actual chat history from session
        // For now, just scroll to bottom to show the welcome message
        scrollToBottom();
    }
    
    /**
     * Send message to the server and display it
     */
    async function sendMessage(e) {
        e.preventDefault();
        
        const message = messageInput.value.trim();
        if (!message) return;
        
        // Display user message
        addMessage(message, 'user');
        
        // Clear input
        messageInput.value = '';
        
        // Show loading overlay
        loadingOverlay.classList.remove('d-none');
        
        try {
            // Send to server
            const response = await fetch('/send_message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    subject: currentSubject,
                    mode: currentMode
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Display bot response
                addMessage(data.response, 'bot');
            } else {
                // Display error
                const errorMsg = data.error || 'Đã xảy ra lỗi khi gửi tin nhắn.';
                addErrorMessage(errorMsg);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            addErrorMessage('Không thể kết nối với máy chủ. Vui lòng thử lại sau.');
        } finally {
            // Hide loading overlay
            loadingOverlay.classList.add('d-none');
            // Scroll to bottom
            scrollToBottom();
        }
    }
    
    /**
     * Add a new message to the chat area
     */
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}-message`;
        
        const timestamp = new Date().toLocaleTimeString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit'
        });
        
        const iconClass = sender === 'user' ? 'fas fa-user' : 'fas fa-robot';
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-avatar">
                    <i class="${iconClass}"></i>
                </div>
                <div class="message-text">
                    <p>${formatMessage(text)}</p>
                    <div class="message-time">${timestamp}</div>
                </div>
            </div>
        `;
        
        chatArea.appendChild(messageDiv);
        scrollToBottom();
    }
    
    /**
     * Add an error message to the chat
     */
    function addErrorMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message bot-message';
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-avatar bg-danger">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="message-text bg-danger text-white">
                    <p>${text}</p>
                </div>
            </div>
        `;
        
        chatArea.appendChild(messageDiv);
        scrollToBottom();
    }
    
    /**
     * Format message text with line breaks and code formatting
     */
    function formatMessage(text) {
        // Replace line breaks with <br>
        return text
            .replace(/\n/g, '<br>')
            .replace(/```([\s\S]*?)```/g, '<pre>$1</pre>'); // Format code blocks
    }
    
    /**
     * Scroll chat area to the bottom
     */
    function scrollToBottom() {
        chatArea.scrollTop = chatArea.scrollHeight;
    }
    
    /**
     * Clear chat history
     */
    async function clearChatHistory() {
        try {
            const response = await fetch('/clear_history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Clear chat area except for the welcome message
                while (chatArea.children.length > 1) {
                    chatArea.removeChild(chatArea.lastChild);
                }
            } else {
                console.error('Error clearing history:', data.error);
            }
        } catch (error) {
            console.error('Error clearing history:', error);
        }
    }
    
    /**
     * Set the active mode
     */
    function setActiveMode(mode) {
        currentMode = mode;
        currentModeDisplay.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
        
        // Update active button styling
        modeButtons.forEach(button => {
            if (button.getAttribute('data-mode') === mode) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
        
        // Update placeholder text based on mode
        if (mode === 'giải bài tập') {
            messageInput.placeholder = 'Nhập bài tập cần giải ở đây...';
        } else {
            messageInput.placeholder = 'Nhập câu hỏi của bạn ở đây...';
        }
    }
    
    /**
     * Set the active subject
     */
    function setActiveSubject(subject) {
        currentSubject = subject;
        currentSubjectDisplay.textContent = subject;
        
        // Update active button styling
        subjectButtons.forEach(button => {
            if (button.getAttribute('data-subject') === subject) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }
});
