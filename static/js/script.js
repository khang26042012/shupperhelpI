document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const chatArea = document.getElementById('chatArea');
    const messageForm = document.getElementById('messageForm');
    const messageInput = document.getElementById('messageInput');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const toggleMathButton = document.getElementById('toggleMathButton');
    const toggleDarkModeButton = document.getElementById('toggleDarkModeButton');
    const mathInputContainer = document.querySelector('.math-input-container');
    const insertMathButton = document.getElementById('insertMathButton');
    const darkModeText = document.getElementById('darkModeText');
    
    // MathQuill elements
    let mathField;
    let mathPreview = document.getElementById('mathPreview');

    // Dark mode state
    let isDarkMode = false;
    
    // Kiểm tra localStorage cho chế độ tối
    if (localStorage.getItem('darkMode') === 'enabled') {
        enableDarkMode();
    }

    // Initialize chat
    initializeChat();

    // Initialize MathQuill
    initializeMathQuill();

    // Event listeners
    messageForm.addEventListener('submit', handleMessageSubmit);
    clearHistoryBtn.addEventListener('click', clearChatHistory);
    toggleMathButton.addEventListener('click', toggleMathInput);
    toggleDarkModeButton.addEventListener('click', toggleDarkMode);
    
    if (insertMathButton) {
        insertMathButton.addEventListener('click', insertMathExpression);
    }

    // Allow pressing Enter to send message (Shift+Enter for new line)
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleMessageSubmit(e);
        }
    });
    
    function initializeMathQuill() {
        const mathInputEl = document.getElementById('mathInput');
        if (mathInputEl) {
            mathField = MQ.MathField(mathInputEl, {
                spaceBehavesLikeTab: true,
                handlers: {
                    edit: function() {
                        const latex = mathField.latex();
                        updateMathPreview(latex);
                    }
                }
            });
        }
    }
    
    function updateMathPreview(latex) {
        if (mathPreview) {
            mathPreview.innerHTML = '\\(' + latex + '\\)';
            if (window.MathJax) {
                MathJax.typesetPromise([mathPreview]);
            }
        }
    }
    
    function toggleMathInput() {
        mathInputContainer.classList.toggle('d-none');
        insertMathButton.classList.toggle('d-none');
        
        if (!mathInputContainer.classList.contains('d-none')) {
            if (mathField) {
                setTimeout(() => mathField.focus(), 100);
            }
        }
    }
    
    function insertMathExpression() {
        if (mathField) {
            const latex = mathField.latex();
            messageInput.value += ' $' + latex + '$ ';
            mathInputContainer.classList.add('d-none');
            insertMathButton.classList.add('d-none');
            messageInput.focus();
        }
    }
    
    function toggleDarkMode() {
        if (isDarkMode) {
            disableDarkMode();
        } else {
            enableDarkMode();
        }
    }
    
    function enableDarkMode() {
        document.body.classList.add('dark-mode');
        darkModeText.textContent = 'Chế độ sáng';
        isDarkMode = true;
        localStorage.setItem('darkMode', 'enabled');
    }
    
    function disableDarkMode() {
        document.body.classList.remove('dark-mode');
        darkModeText.textContent = 'Chế độ tối';
        isDarkMode = false;
        localStorage.setItem('darkMode', 'disabled');
    }

    async function handleMessageSubmit(e) {
        e.preventDefault();

        const message = messageInput.value.trim();
        if (!message) return;

        addMessage(message, 'user');
        messageInput.value = '';
        loadingOverlay.classList.remove('d-none');

        try {
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
                let formattedResponse = data.response;
                // Xử lý các bước giải toán
                formattedResponse = formattedResponse.replace(/\*\*"([^"]+)"\*\*/g, (_, content) => {
                    return `<strong>${content}</strong>`;
                });

                // Định dạng công thức toán học
                formattedResponse = formattedResponse.replace(/\$\$(.*?)\$\$/g, (_, formula) => {
                    return `\\[${formula}\\]`;
                });
                formattedResponse = formattedResponse.replace(/\$(.*?)\$/g, (_, formula) => {
                    return `\\(${formula}\\)`;
                });

                addMessage(formattedResponse, 'bot');

                if (window.MathJax) {
                    MathJax.typesetPromise();
                }
            } else {
                const errorMsg = data.error || 'Đã xảy ra lỗi khi gửi tin nhắn.';
                addErrorMessage(errorMsg);
            }
        } catch (error) {
            console.error('Error:', error);
            addErrorMessage('Không thể kết nối với máy chủ. Vui lòng thử lại sau.');
        } finally {
            loadingOverlay.classList.add('d-none');
            scrollToBottom();
        }
    }

    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}-message`;

        const timestamp = new Date().toLocaleTimeString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit'
        });

        const iconClass = sender === 'user' ? 'fas fa-user' : 'fas fa-robot';
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
                    ${formatMessage(formattedText)}
                    ${explanationSection}
                    <div class="message-time">${timestamp}</div>
                </div>
            </div>
        `;

        chatArea.appendChild(messageDiv);

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

        if (window.MathJax) {
            MathJax.typesetPromise();
        }

        scrollToBottom();
    }

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

    function formatMessage(text) {
        // Thay thế các từ tiếng Anh phổ biến sang tiếng Việt
        const translations = {
            'Express': 'Biểu diễn',
            'Solve': 'Giải',
            'Find': 'Tìm',
            'in terms of': 'theo',
            'solution': 'nghiệm',
            'specific solutions': 'nghiệm cụ thể',
            'For example': 'Ví dụ',
            'is a': 'là một',
            'To graph': 'Để vẽ đồ thị',
            'you only need': 'bạn chỉ cần',
            'two points': 'hai điểm',
            'The examples above': 'Các ví dụ trên',
            'would be': 'sẽ là',
            'This is a linear equation': 'Đây là phương trình tuyến tính',
            'in two variables': 'với hai biến số',
            'it represents': 'biểu diễn',
            'a straight line': 'một đường thẳng',
            'on a graph': 'trên hệ trục tọa độ',
            'you can': 'bạn có thể',
            'Get for y': 'Tìm y',
            'Get for x': 'Tìm x',
            'Find the x-intercept': 'Tìm điểm cắt trục x',
            'where y': 'khi y',
            'Subtract': 'Trừ',
            'from both sides': 'ở cả hai vế',
            'Divide both sides by': 'Chia cả hai vế cho',
            'specific solutions': 'nghiệm cụ thể',
            'that satisfy the equation': 'thỏa mãn phương trình',
            'Graph the line': 'Vẽ đường thẳng',
            'Plot the points': 'Vẽ các điểm',
            'Draw a line': 'Vẽ một đường thẳng',
            'through them': 'qua chúng',
            'Every point on that line': 'Mọi điểm trên đường thẳng đó',
            'represents a solution': 'biểu diễn một nghiệm',
            'The solution is': 'Nghiệm là'
        };

        let formattedText = text;
        for (const [eng, viet] of Object.entries(translations)) {
            formattedText = formattedText.replace(new RegExp(eng, 'gi'), viet);
        }

        return formattedText
            .replace(/\n/g, '<br>')
            .replace(/```([\s\S]*?)```/g, '<pre>$1</pre>');
    }

    function scrollToBottom() {
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    function initializeChat() {
        scrollToBottom();
    }

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
                while (chatArea.children.length > 1) {
                    chatArea.removeChild(chatArea.lastChild);
                }
            } else {
                console.error('Error:', data.error);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
});