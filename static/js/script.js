document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const chatArea = document.getElementById('chatArea');
    const messageForm = document.getElementById('messageForm');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    
    
    // Không còn sử dụng các biến cũ liên quan đến hình ảnh và camera
    
    // Không còn sử dụng các biến môn học và chế độ
    
    // Initialize the chat area with any existing messages
    initializeChat();
    
    // Event listeners chính
    messageForm.addEventListener('submit', sendMessage);
    clearHistoryBtn.addEventListener('click', clearChatHistory);
    
    // Allow pressing Enter to send message (Shift+Enter for new line)
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(e);
        }
    });
    
    /**
     * Toggle visibility of image options
     */
    function toggleImageOptions(e) {
        // Ngăn form submit nếu nút nằm trong form
        if (e) e.preventDefault();
        
        console.log("toggleImageOptions called");
        if (imageOptionsVisible) {
            // Ẩn các tùy chọn hình ảnh
            imageOptionsDiv.classList.add('d-none');
            solveWithImageBtn.classList.remove('bg-primary');
            solveWithImageBtn.classList.add('bg-light');
            solveWithImageBtn.classList.remove('text-white');
            solveWithImageBtn.classList.add('text-muted');
        } else {
            // Hiện các tùy chọn hình ảnh
            imageOptionsDiv.classList.remove('d-none');
            solveWithImageBtn.classList.remove('bg-light');
            solveWithImageBtn.classList.add('bg-primary');
            solveWithImageBtn.classList.remove('text-muted');
            solveWithImageBtn.classList.add('text-white');
        }
        imageOptionsVisible = !imageOptionsVisible;
        console.log("Image options visibility:", imageOptionsVisible);
    }
    
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
        
        // Kiểm tra xem có phải là phản hồi có phần giải thích không
        let formattedText = text;
        let explanationSection = '';
        
        if (sender === 'bot') {
            const parts = text.split('---GIẢI THÍCH---');
            if (parts.length > 1) {
                // Có phần giải thích
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
        
        // Thêm sự kiện cho nút xem giải thích
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

    /**
     * Handle image upload from file input
     */
    function handleImageUpload() {
        if (imageFileInput.files && imageFileInput.files[0]) {
            const file = imageFileInput.files[0];
            
            // Check if file is an image
            if (!file.type.match('image.*')) {
                addErrorMessage('Vui lòng chọn file hình ảnh');
                return;
            }
            
            // Show loading overlay
            loadingOverlay.classList.remove('d-none');
            
            // Create a form data object
            const formData = new FormData();
            formData.append('image', file);
            formData.append('subject', currentSubject);
            
            // Send image to server
            sendImageToServer(formData, file.name);
        }
    }
    
    /**
     * Start the camera
     */
    async function startCamera() {
        try {
            // Log thông tin về cameraModal để debug
            console.log("cameraModal:", cameraModal);
            
            // Request camera access
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            
            // Display camera preview
            cameraPreview.srcObject = stream;
            cameraPreview.style.display = 'block';
            cameraPlaceholder.style.display = 'none';
            
            // Enable capture button
            capturePictureBtn.disabled = false;
            startCameraBtn.disabled = true;
            
            // Start playing the video
            try {
                await cameraPreview.play();
                console.log("Camera started successfully");
            } catch (playError) {
                console.error("Error playing video:", playError);
                throw playError;
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            addErrorMessage('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
        }
    }
    
    /**
     * Capture image from camera
     */
    function captureImage() {
        // Set canvas dimensions to match video
        cameraCanvas.width = cameraPreview.videoWidth;
        cameraCanvas.height = cameraPreview.videoHeight;
        
        // Draw current video frame to canvas
        const ctx = cameraCanvas.getContext('2d');
        ctx.drawImage(cameraPreview, 0, 0, cameraCanvas.width, cameraCanvas.height);
        
        // Get image data
        capturedImage = cameraCanvas.toDataURL('image/jpeg');
        
        // Show canvas with captured image
        cameraCanvas.style.display = 'block';
        cameraPreview.style.display = 'none';
        
        // Update buttons
        capturePictureBtn.disabled = true;
        retakePictureBtn.disabled = false;
        sendPictureBtn.disabled = false;
        
        // Stop camera stream
        stopCamera();
    }
    
    /**
     * Retake image (discard current capture)
     */
    function retakeImage() {
        // Clear the captured image
        capturedImage = null;
        
        // Hide canvas, show video
        cameraCanvas.style.display = 'none';
        cameraPreview.style.display = 'block';
        
        // Update buttons
        retakePictureBtn.disabled = true;
        sendPictureBtn.disabled = true;
        
        // Restart camera
        startCamera();
    }
    
    /**
     * Send captured image from camera to server
     */
    function sendCapturedImage() {
        if (!capturedImage) {
            console.error("No image captured");
            addErrorMessage('Không có ảnh để gửi. Vui lòng chụp ảnh trước.');
            return;
        }
        
        try {
            // Hide camera modal safely
            if (cameraModal && typeof cameraModal.hide === 'function') {
                cameraModal.hide();
            } else if (cameraModalEl) {
                // Fallback method if modal object isn't working properly
                const bsModal = bootstrap.Modal.getInstance(cameraModalEl);
                if (bsModal) bsModal.hide();
            }
            
            // Show loading overlay
            if (loadingOverlay) loadingOverlay.classList.remove('d-none');
            
            // Set image data in hidden form
            imageDataInput.value = capturedImage;
            imageSubjectInput.value = currentSubject;
            
            // Create form data
            const formData = new FormData();
            formData.append('image_data', capturedImage);
            formData.append('subject', currentSubject);
            
            // Log image data information for debugging
            console.log("Sending image data:", capturedImage.substring(0, 50) + "...");
            console.log("Subject:", currentSubject);
            
            // Send to server
            sendImageToServer(formData, 'camera_capture.jpg');
        } catch (error) {
            console.error("Error sending captured image:", error);
            addErrorMessage('Lỗi khi gửi ảnh: ' + error.message);
            loadingOverlay.classList.add('d-none');
        }
    }
    
    /**
     * Stop camera stream
     */
    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        
        // Reset UI elements
        startCameraBtn.disabled = false;
    }
    
    /**
     * Send image to server for analysis
     */
    async function sendImageToServer(formData, filename) {
        try {
            // Add user message to chat
            const imageText = `[Hình ảnh bài tập môn ${currentSubject}]`;
            addMessage(imageText, 'user');
            
            // Send data to server
            const response = await fetch('/upload_image', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Display AI response
                addMessage(data.response, 'bot');
                
                // Display the uploaded image in chat
                if (data.image_url) {
                    addImageToChat(data.image_url);
                }
            } else {
                // Handle error
                const errorMsg = data.error || 'Đã xảy ra lỗi khi xử lý ảnh';
                addErrorMessage(errorMsg);
            }
        } catch (error) {
            console.error('Error sending image:', error);
            addErrorMessage('Không thể gửi ảnh lên máy chủ. Vui lòng thử lại sau.');
        } finally {
            // Hide loading overlay
            loadingOverlay.classList.add('d-none');
            
            // Reset file input
            imageFileInput.value = '';
            
            // Scroll chat to bottom
            scrollToBottom();
        }
    }
    
    /**
     * Add image to chat
     */
    function addImageToChat(imageUrl) {
        const imageDiv = document.createElement('div');
        imageDiv.className = 'chat-message user-message';
        
        const timestamp = new Date().toLocaleTimeString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit'
        });
        
        imageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="message-text">
                    <img src="${imageUrl}" alt="Bài tập" class="img-fluid rounded mb-2" style="max-height: 200px;">
                    <div class="message-time">${timestamp}</div>
                </div>
            </div>
        `;
        
        // Insert image before the last message (which is already the text indicator)
        const lastMessage = chatArea.lastChild;
        chatArea.insertBefore(imageDiv, lastMessage);
        scrollToBottom();
    }
});
