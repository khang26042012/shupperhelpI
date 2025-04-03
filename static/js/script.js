document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const chatArea = document.getElementById('chatArea');
    const messageForm = document.getElementById('messageForm');
    const messageInput = document.getElementById('messageInput');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const processingImageOverlay = document.getElementById('processingImageOverlay');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const toggleMathButton = document.getElementById('toggleMathButton');
    const toggleDarkModeButton = document.getElementById('toggleDarkModeButton');
    const toggleImageUploadButton = document.getElementById('toggleImageUploadButton');
    const mathInputContainer = document.querySelector('.math-input-container');
    const imageUploadContainer = document.querySelector('.image-upload-container');
    const insertMathButton = document.getElementById('insertMathButton');
    const darkModeText = document.getElementById('darkModeText');
    const solutionModeBtns = document.querySelectorAll('.solution-mode-btn');
    
    // Image Upload Elements
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const captureImageButton = document.getElementById('captureImageButton');
    const processImageButton = document.getElementById('processImageButton');
    const ocrResultContainer = document.getElementById('ocrResultContainer');
    const extractedText = document.getElementById('extractedText');
    const useExtractedTextButton = document.getElementById('useExtractedTextButton');
    
    // Camera elements
    const cameraModal = document.getElementById('cameraModal');
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const takePhotoButton = document.getElementById('takePhotoButton');
    
    // MathQuill elements
    let mathField;
    let mathPreview = document.getElementById('mathPreview');

    // Solution mode state
    let currentSolutionMode = 'full';

    // Dark mode state
    let isDarkMode = false;
    
    // Kiểm tra localStorage cho chế độ tối
    if (localStorage.getItem('darkMode') === 'enabled') {
        enableDarkMode();
    }

    // Kiểm tra localStorage cho chế độ giải bài
    const savedSolutionMode = localStorage.getItem('solutionMode');
    if (savedSolutionMode) {
        currentSolutionMode = savedSolutionMode;
        updateSolutionModeButtons(currentSolutionMode);
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
    toggleImageUploadButton.addEventListener('click', toggleImageUpload);
    
    // Image upload event listeners
    if (imageInput) {
        imageInput.addEventListener('change', handleImagePreview);
    }
    
    if (processImageButton) {
        processImageButton.addEventListener('click', processImage);
    }
    
    if (useExtractedTextButton) {
        useExtractedTextButton.addEventListener('click', useExtractedTextAsInput);
    }
    
    if (captureImageButton) {
        captureImageButton.addEventListener('click', openCamera);
    }
    
    if (takePhotoButton) {
        takePhotoButton.addEventListener('click', takePhoto);
    }
    
    // Solution mode buttons event listeners
    solutionModeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const mode = this.getAttribute('data-mode');
            currentSolutionMode = mode;
            updateSolutionModeButtons(mode);
            localStorage.setItem('solutionMode', mode);
        });
    });
    
    if (insertMathButton) {
        insertMathButton.addEventListener('click', insertMathExpression);
    }
    
    // Update solution mode buttons
    function updateSolutionModeButtons(mode) {
        solutionModeBtns.forEach(btn => {
            if (btn.getAttribute('data-mode') === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
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
            // Gửi thông tin về chế độ giải bài
            const response = await fetch('/send_message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    solution_mode: currentSolutionMode,
                    subject: 'toán học',  // Mặc định là "toán học"
                    mode: 'giải bài tập'  // Mặc định là "giải bài tập"
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

                // Xử lý các phần giải thích từng bước
                let explanationText = '';
                let mainText = formattedResponse;
                
                // Xử lý format từng bước
                if (currentSolutionMode === 'step_by_step') {
                    const parts = formattedResponse.split('---GIẢI THÍCH TỪNG BƯỚC---');
                    if (parts.length > 1) {
                        mainText = parts[0].trim();
                        explanationText = parts[1].trim();
                    }
                } 
                // Xử lý format đầy đủ
                else if (currentSolutionMode === 'full') {
                    const parts = formattedResponse.split('---GIẢI THÍCH---');
                    if (parts.length > 1) {
                        mainText = parts[0].trim();
                        explanationText = parts[1].trim();
                    }
                }
                // Gợi ý không cần xử lý đặc biệt vì không có phần ---GIẢI THÍCH---

                // Nếu có phần giải thích, hiển thị riêng
                if (explanationText) {
                    const solutionMode = currentSolutionMode === 'step_by_step' ? 'GIẢI THÍCH TỪNG BƯỚC' : 'GIẢI THÍCH';
                    formattedResponse = `${mainText}\n\n---${solutionMode}---\n${explanationText}`;
                }

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
            // Kiểm tra cả hai loại định dạng giải thích
            let parts = [];
            let buttonText = '';
            
            if (text.includes('---GIẢI THÍCH TỪNG BƯỚC---')) {
                parts = text.split('---GIẢI THÍCH TỪNG BƯỚC---');
                buttonText = 'Xem giải thích từng bước';
            } else if (text.includes('---GIẢI THÍCH---')) {
                parts = text.split('---GIẢI THÍCH---');
                buttonText = 'Xem giải thích';
            }
            
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
                        <i class="fas fa-lightbulb me-1"></i> ${buttonText}
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
                        
                        // Xác định loại giải thích để hiển thị đúng tên nút
                        const buttonText = this.textContent.includes('từng bước') 
                            ? 'Xem giải thích từng bước' 
                            : 'Xem giải thích';
                            
                        this.innerHTML = isVisible 
                            ? `<i class="fas fa-lightbulb me-1"></i> ${buttonText}`
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
    
    // Image and Camera Functions
    
    function toggleImageUpload() {
        imageUploadContainer.classList.toggle('d-none');
        
        // Ẩn hộp nhập công thức toán học nếu đang mở
        if (!mathInputContainer.classList.contains('d-none')) {
            mathInputContainer.classList.add('d-none');
            insertMathButton.classList.add('d-none');
        }
    }
    
    function handleImagePreview(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                imagePreview.src = event.target.result;
                imagePreviewContainer.classList.remove('d-none');
                
                // Ẩn kết quả OCR nếu đang hiển thị
                ocrResultContainer.classList.add('d-none');
            };
            reader.readAsDataURL(file);
        }
    }
    
    async function processImage() {
        const file = imageInput.files[0];
        if (!file) {
            alert('Vui lòng chọn một hình ảnh trước');
            return;
        }
        
        // Hiển thị overlay đang xử lý
        processingImageOverlay.classList.remove('d-none');
        
        const formData = new FormData();
        formData.append('image', file);
        
        try {
            const response = await fetch('/upload_image', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Hiển thị kết quả
                extractedText.value = data.extracted_text;
                ocrResultContainer.classList.remove('d-none');
                
                // Hiển thị ảnh đã xử lý
                if (data.processed_image_b64) {
                    const processedImg = `data:image/jpeg;base64,${data.processed_image_b64}`;
                    imagePreview.src = processedImg;
                }
            } else {
                alert(data.error || 'Có lỗi xảy ra khi xử lý ảnh');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Không thể kết nối với máy chủ. Vui lòng thử lại sau.');
        } finally {
            processingImageOverlay.classList.add('d-none');
        }
    }
    
    function useExtractedTextAsInput() {
        const text = extractedText.value.trim();
        if (text) {
            messageInput.value = text;
            imageUploadContainer.classList.add('d-none');
            messageInput.focus();
        }
    }
    
    function openCamera() {
        // Khởi tạo camera
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(function(stream) {
                    video.srcObject = stream;
                    // Hiển thị modal
                    const modal = new bootstrap.Modal(cameraModal);
                    modal.show();
                    
                    // Thêm sự kiện khi đóng modal
                    cameraModal.addEventListener('hidden.bs.modal', function() {
                        // Dừng camera khi đóng modal
                        const stream = video.srcObject;
                        if (stream) {
                            const tracks = stream.getTracks();
                            tracks.forEach(track => track.stop());
                            video.srcObject = null;
                        }
                    }, { once: true });
                })
                .catch(function(error) {
                    console.error('Không thể truy cập camera:', error);
                    alert('Không thể truy cập camera. Vui lòng cho phép quyền truy cập camera hoặc sử dụng tính năng tải ảnh lên.');
                });
        } else {
            alert('Trình duyệt của bạn không hỗ trợ truy cập camera. Vui lòng sử dụng tính năng tải ảnh lên.');
        }
    }
    
    function takePhoto() {
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Chuyển đổi ảnh thành dạng Blob
        canvas.toBlob(function(blob) {
            // Tạo file từ blob
            const file = new File([blob], 'captured_image.jpg', { type: 'image/jpeg' });
            
            // Tạo FileList giả để gán cho input
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            imageInput.files = dataTransfer.files;
            
            // Kích hoạt sự kiện change để hiển thị xem trước
            const changeEvent = new Event('change', { bubbles: true });
            imageInput.dispatchEvent(changeEvent);
            
            // Đóng modal
            const modalElement = document.getElementById('cameraModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
            }
        }, 'image/jpeg', 0.95);
    }
});