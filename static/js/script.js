window.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded, initializing application...');
    
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
    
    // Kiểm tra xem các phần tử DOM cần thiết đã tồn tại chưa
    if (!chatArea) console.warn('chatArea element not found');
    if (!messageForm) console.warn('messageForm element not found');
    if (!messageInput) console.warn('messageInput element not found');
    if (!loadingOverlay) console.warn('loadingOverlay element not found');
    if (!processingImageOverlay) console.warn('processingImageOverlay element not found');
    if (!toggleMathButton) console.warn('toggleMathButton element not found');
    if (!toggleDarkModeButton) console.warn('toggleDarkModeButton element not found');
    if (!toggleImageUploadButton) console.warn('toggleImageUploadButton element not found');
    if (!captureImageButton) console.warn('captureImageButton element not found');
    if (!takePhotoButton) console.warn('takePhotoButton element not found');
    if (!cameraModal) console.warn('cameraModal element not found');
    if (!video) console.warn('video element not found');
    if (!canvas) console.warn('canvas element not found');
    
    // Kiểm tra cửa sổ Bootstrap
    if (typeof bootstrap === 'undefined') {
        console.warn('Bootstrap is not loaded or not defined');
    } else if (!bootstrap.Modal) {
        console.warn('Bootstrap Modal class is not available');
    } else {
        console.log('Bootstrap Modal is available');
    }
    
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
    setTimeout(initializeChat, 500);

    // Initialize MathQuill
    initializeMathQuill();

    // Thiết lập event listeners với kiểm tra null
    if (messageForm) {
        messageForm.addEventListener('submit', handleMessageSubmit);
    } else {
        console.warn('Cannot attach event to messageForm - element not found');
    }
    
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', clearChatHistory);
    }
    
    if (toggleMathButton) {
        toggleMathButton.addEventListener('click', toggleMathInput);
    }
    
    if (toggleDarkModeButton) {
        toggleDarkModeButton.addEventListener('click', toggleDarkMode);
    }
    
    if (toggleImageUploadButton) {
        toggleImageUploadButton.addEventListener('click', toggleImageUpload);
    }
    
    // Image upload event listeners
    if (imageInput) {
        imageInput.addEventListener('change', handleImagePreview);
    }
    
    if (processImageButton) {
        processImageButton.addEventListener('click', function() {
            console.log('Process Image button clicked');
            processImage();
        });
    }
    
    // Chức năng OCR đã bị loại bỏ, thay thế bằng phân tích ảnh trực tiếp bởi AI
    // Không còn cần đến useExtractedTextButton
    
    if (captureImageButton) {
        captureImageButton.addEventListener('click', function() {
            console.log('Capture Image button clicked');
            openCamera();
        });
    }
    
    if (takePhotoButton) {
        takePhotoButton.addEventListener('click', function() {
            console.log('Take Photo button clicked');
            takePhoto();
        });
    }
    
    // Solution mode buttons event listeners
    if (solutionModeBtns) {
        solutionModeBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const mode = this.getAttribute('data-mode');
                currentSolutionMode = mode;
                updateSolutionModeButtons(mode);
                localStorage.setItem('solutionMode', mode);
            });
        });
    }
    
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
                    subject: 'chung',  // Mở rộng để hỗ trợ tất cả các chủ đề
                    mode: 'giải bài tập'  // Giữ chế độ giải bài tập
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
        // Kiểm tra xem chatArea có tồn tại không
        if (!chatArea) {
            console.error('Chat area element not found');
            return;
        }

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

        try {
            chatArea.appendChild(messageDiv);
        } catch (error) {
            console.error('Error appending message:', error);
        }

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
        console.log("Initializing chat...");
        if (chatArea) {
            // Hiển thị tin nhắn chào mừng khi khởi động ứng dụng
            const welcomeMessage = "Xin chào! Tôi là trợ lý AI học tập. Bạn có thể hỏi tôi bất cứ câu hỏi nào hoặc tải ảnh lên để tôi giải đáp.";
            addMessage(welcomeMessage, 'bot');
            scrollToBottom();
        } else {
            console.warn("Chat area not found during initialization");
        }
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
        // Lấy các phần tử DOM một cách an toàn
        const imageUploadContainerElement = document.querySelector('.image-upload-container');
        const mathInputContainerElement = document.querySelector('.math-input-container');
        const insertMathButtonElement = document.getElementById('insertMathButton');
        
        if (imageUploadContainerElement) {
            imageUploadContainerElement.classList.toggle('d-none');
            
            // Ẩn hộp nhập công thức toán học nếu đang mở
            if (mathInputContainerElement && !mathInputContainerElement.classList.contains('d-none')) {
                mathInputContainerElement.classList.add('d-none');
                
                if (insertMathButtonElement) {
                    insertMathButtonElement.classList.add('d-none');
                }
            }
        } else {
            console.error('Không tìm thấy phần tử imageUploadContainer');
        }
    }
    
    function handleImagePreview(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                // Lấy phần tử DOM một cách an toàn
                const imagePreviewElement = document.getElementById('imagePreview');
                const imagePreviewContainerElement = document.getElementById('imagePreviewContainer');
                
                if (imagePreviewElement && imagePreviewContainerElement) {
                    imagePreviewElement.src = event.target.result;
                    imagePreviewContainerElement.classList.remove('d-none');
                    console.log('Ảnh đã được tải lên và hiển thị xem trước');
                } else {
                    console.error('Không tìm thấy phần tử imagePreview hoặc imagePreviewContainer');
                }
            };
            reader.readAsDataURL(file);
        }
    }
    
    async function processImage() {
        try {
            // Lấy các phần tử DOM một cách an toàn
            const imageInputElement = document.getElementById('imageInput');
            const processingImageOverlayElement = document.getElementById('processingImageOverlay');
            const imageUploadContainerElement = document.querySelector('.image-upload-container');
            
            if (!imageInputElement) {
                console.error('Không tìm thấy phần tử imageInput');
                alert('Không thể xử lý ảnh. Vui lòng tải lại trang và thử lại.');
                return;
            }
            
            const file = imageInputElement.files[0];
            if (!file) {
                alert('Vui lòng chọn một hình ảnh trước');
                return;
            }
            
            // Hiển thị overlay đang xử lý
            if (processingImageOverlayElement) {
                processingImageOverlayElement.classList.remove('d-none');
            }
            
            const formData = new FormData();
            formData.append('image', file);
            formData.append('solution_mode', currentSolutionMode);
            formData.append('subject', 'chung');
            formData.append('mode', 'giải bài tập');
            
            console.log('Đang gửi ảnh để xử lý...');
            
            const response = await fetch('/upload_image', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                console.log('Ảnh đã được xử lý thành công');
                
                // Ẩn container tải ảnh lên
                if (imageUploadContainerElement) {
                    imageUploadContainerElement.classList.add('d-none');
                }
                
                // Hiển thị ảnh đã tối ưu
                if (data.optimized_image_b64) {
                    const optimizedImg = `data:image/jpeg;base64,${data.optimized_image_b64}`;
                    
                    // Thêm hình ảnh vào tin nhắn người dùng
                    const imgMsg = `<div class="uploaded-image-container mb-2">
                        <p class="mb-1"><i class="fas fa-image me-1"></i>Ảnh đã tải lên:</p>
                        <img src="${optimizedImg}" class="img-fluid img-thumbnail uploaded-image" style="max-height: 200px;">
                    </div>
                    <p>Hãy giải thích nội dung trong ảnh này</p>`;
                    
                    addMessage(imgMsg, 'user');
                }
                
                // Xử lý phản hồi từ AI
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

                // Nếu có phần giải thích, hiển thị riêng
                if (explanationText) {
                    const solutionMode = currentSolutionMode === 'step_by_step' ? 'GIẢI THÍCH TỪNG BƯỚC' : 'GIẢI THÍCH';
                    formattedResponse = `${mainText}\n\n---${solutionMode}---\n${explanationText}`;
                }

                // Thêm phản hồi AI vào cuộc trò chuyện
                addMessage(formattedResponse, 'bot');

                if (window.MathJax) {
                    MathJax.typesetPromise();
                }
                
            } else {
                alert(data.error || 'Có lỗi xảy ra khi xử lý ảnh');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Không thể kết nối với máy chủ. Vui lòng thử lại sau.');
        } finally {
            // Ẩn overlay xử lý ảnh một cách an toàn
            const processingImageOverlayElement = document.getElementById('processingImageOverlay');
            if (processingImageOverlayElement) {
                processingImageOverlayElement.classList.add('d-none');
            }
        }
    }
    
    function openCamera() {
        try {
            // Lấy các phần tử DOM một cách an toàn
            const videoElement = document.getElementById('video');
            const cameraModalElement = document.getElementById('cameraModal');
            
            if (!videoElement) {
                console.error('Không tìm thấy phần tử video');
                alert('Không thể khởi tạo camera. Vui lòng sử dụng tính năng tải ảnh lên.');
                return;
            }
            
            if (!cameraModalElement) {
                console.error('Không tìm thấy phần tử cameraModal');
                alert('Không thể khởi tạo cửa sổ camera. Vui lòng sử dụng tính năng tải ảnh lên.');
                return;
            }
            
            // Khởi tạo camera
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia({ video: true })
                    .then(function(stream) {
                        videoElement.srcObject = stream;
                        
                        // Hiển thị modal bằng Bootstrap 5
                        const modal = new bootstrap.Modal(cameraModalElement);
                        modal.show();
                        
                        // Thêm sự kiện khi đóng modal
                        cameraModalElement.addEventListener('hidden.bs.modal', function() {
                            // Dừng camera khi đóng modal
                            const stream = videoElement.srcObject;
                            if (stream) {
                                const tracks = stream.getTracks();
                                tracks.forEach(track => track.stop());
                                videoElement.srcObject = null;
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
        } catch (error) {
            console.error('Lỗi khi mở camera:', error);
            alert('Đã xảy ra lỗi khi mở camera. Vui lòng sử dụng tính năng tải ảnh lên.');
        }
    }
    
    function takePhoto() {
        try {
            // Lấy các phần tử DOM một cách an toàn
            const canvasElement = document.getElementById('canvas');
            const videoElement = document.getElementById('video');
            const imageInputElement = document.getElementById('imageInput');
            
            // Kiểm tra xem các thành phần DOM đã tồn tại chưa
            if (!canvasElement) {
                console.error('Không tìm thấy phần tử canvas');
                alert('Không thể chụp ảnh. Vui lòng sử dụng tính năng tải ảnh lên.');
                return;
            }
            
            if (!videoElement) {
                console.error('Không tìm thấy phần tử video');
                alert('Không thể chụp ảnh. Vui lòng sử dụng tính năng tải ảnh lên.');
                return;
            }
            
            if (!imageInputElement) {
                console.error('Không tìm thấy phần tử imageInput');
                alert('Không thể chụp ảnh. Vui lòng sử dụng tính năng tải ảnh lên.');
                return;
            }
            
            const context = canvasElement.getContext('2d');
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;
            context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
            
            // Chuyển đổi ảnh thành dạng Blob
            canvasElement.toBlob(function(blob) {
                try {
                    // Tạo file từ blob
                    const file = new File([blob], 'captured_image.jpg', { type: 'image/jpeg' });
                    
                    // Tạo FileList giả để gán cho input
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    imageInputElement.files = dataTransfer.files;
                    
                    // Kích hoạt sự kiện change để hiển thị xem trước
                    const changeEvent = new Event('change', { bubbles: true });
                    imageInputElement.dispatchEvent(changeEvent);
                    
                    // Đóng modal
                    const modalElement = document.getElementById('cameraModal');
                    if (modalElement) {
                        const modal = bootstrap.Modal.getInstance(modalElement);
                        if (modal) {
                            modal.hide();
                        } else {
                            // Nếu không lấy được instance thì tạo mới và đóng
                            new bootstrap.Modal(modalElement).hide();
                        }
                    }
                    
                    // Hiển thị ảnh preview
                    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
                    const imagePreview = document.getElementById('imagePreview');
                    
                    if (imagePreviewContainer && imagePreview) {
                        imagePreviewContainer.classList.remove('d-none');
                        imagePreview.src = URL.createObjectURL(blob);
                    }
                    
                    // Tự động xử lý ảnh sau khi chụp
                    setTimeout(() => {
                        const processImageBtn = document.getElementById('processImageButton');
                        if (processImageBtn) {
                            processImageBtn.click();
                        }
                    }, 500);
                } catch (error) {
                    console.error('Lỗi khi xử lý ảnh chụp:', error);
                    alert('Đã xảy ra lỗi khi xử lý ảnh chụp. Vui lòng thử lại hoặc sử dụng tính năng tải ảnh lên.');
                }
            }, 'image/jpeg', 0.95);
        } catch (error) {
            console.error('Lỗi khi chụp ảnh:', error);
            alert('Đã xảy ra lỗi khi chụp ảnh. Vui lòng thử lại hoặc sử dụng tính năng tải ảnh lên.');
        }
    }
});
// Ẩn màn hình loading khi tất cả nội dung đã tải xong
window.addEventListener('load', function() {
    console.log("Window fully loaded, hiding page loading indicator");
    const pageLoading = document.getElementById('pageLoading');
    if (pageLoading) {
        pageLoading.style.display = 'none';
    }
});
