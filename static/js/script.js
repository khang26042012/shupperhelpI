document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const chatArea = document.getElementById('chatArea');
    const messageForm = document.getElementById('messageForm');
    const messageInput = document.getElementById('messageInput');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');

    // Initialize chat
    initializeChat();

    // Event listeners
    messageForm.addEventListener('submit', handleMessageSubmit);
    clearHistoryBtn.addEventListener('click', clearChatHistory);

    // Allow pressing Enter to send message (Shift+Enter for new line)
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleMessageSubmit(e);
        }
    });

    /**
     * Handle message submission
     */
    async function handleMessageSubmit(e) {
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
                    message: message
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

        // Format text and check for explanations
        let formattedText = text;
        let explanationSection = '';

        if (sender === 'bot') {
            const parts = text.split('---GIẢI THÍCH---');
            if (parts.length > 1) {
                formattedText = parts[0].trim();
                const explanation = parts[1].trim();

                explanationSection = `
                    <div class="explanation-section mt-2" style="display: none;">
                        <hr>
                        <div class="explanation-content">
                            ${formatMessage(explanation)}
                        </div>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-primary mt-2 toggle-explanation">
                        <i class="fas fa-lightbulb me-1"></i> Xem giải thích
                    </button>
                `;
            }
        }

        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-avatar">
                    <i class="${iconClass}"></i>
                </div>
                <div class="message-text">
                    <p>${formatMessage(formattedText)}</p>
                    ${explanationSection}
                    <div class="message-time">${timestamp}</div>
                </div>
            </div>
        `;

        chatArea.appendChild(messageDiv);

        // Add event listener for explanation toggle if present
        if (sender === 'bot') {
            const toggleBtn = messageDiv.querySelector('.toggle-explanation');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', function() {
                    const explanationDiv = messageDiv.querySelector('.explanation-section');
                    if (explanationDiv) {
                        const isVisible = explanationDiv.style.display !== 'none';
                        explanationDiv.style.display = isVisible ? 'none' : 'block';
                        this.innerHTML = isVisible 
                            ? '<i class="fas fa-lightbulb me-1"></i> Xem giải thích'
                            : '<i class="fas fa-times me-1"></i> Ẩn giải thích';
                    }
                });
            }
        }

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
        return text
            .replace(/\n/g, '<br>')
            .replace(/```([\s\S]*?)```/g, '<pre>$1</pre>');
    }

    /**
     * Scroll chat area to the bottom
     */
    function scrollToBottom() {
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    /**
     * Initialize the chat area
     */
    function initializeChat() {
        scrollToBottom();
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
});