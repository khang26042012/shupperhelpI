$(document).ready(function() {
    // Constants and Elements
    const chatArea = document.getElementById("chat-area");
    const messageForm = document.getElementById("message-form");
    const userInput = document.getElementById("user-input");
    const modeSelect = document.getElementById("mode-select");
    const subjectSelect = document.getElementById("subject-select");
    const solutionModeButtons = document.querySelectorAll(".solution-mode-btn");
    const mathInput = document.getElementById("math-input");
    const mathPreview = document.getElementById("math-preview");
    const darkModeToggle = document.getElementById("dark-mode-toggle");
    const uploadForm = document.getElementById("upload-form");
    const imageInput = document.getElementById("image-input");
    const imagePreview = document.getElementById("image-preview");
    const imagePreviewContainer = document.getElementById("image-preview-container");
    const clearPreviewButton = document.getElementById("clear-preview");
    const progressBar = document.getElementById("progress-bar");
    const progressContainer = document.getElementById("progress-container");
    const processImageButton = document.getElementById("process-image");
    const aiResponseModal = document.getElementById("ai-response-modal");
    const aiResponseContent = document.getElementById("ai-response-content");
    const originalImage = document.getElementById("original-image");
    const optimizedImage = document.getElementById("optimized-image");
    const imageUploadButton = document.getElementById("image-upload-button");
    const subjectLabel = document.getElementById("subject-label");
    const modeLabel = document.getElementById("mode-label");
    const solutionModeLabel = document.getElementById("solution-mode-label");
    const solutionModeContainer = document.getElementById("solution-mode-container");

    // Dark Mode
    let isDarkMode = localStorage.getItem('darkMode') === 'enabled';
    
    // Solution Mode
    let currentSolutionMode = "full"; // Default: full solution
    
    // Initialization
    (function initialize() {
        // Update initial state
        updateSolutionModeButtons(currentSolutionMode);
        
        // Initialize MathQuill if needed
        if (mathInput) {
            initializeMathQuill();
        }
        
        // Check dark mode
        if (isDarkMode) {
            enableDarkMode();
        } else {
            disableDarkMode();
        }
        
        // Initialize chat area
        initializeChat();
        
        // Hide loading indicator when window is fully loaded
        window.addEventListener('load', function() {
            console.log("Window fully loaded, hiding page loading indicator");
            const pageLoading = document.getElementById('page-loading');
            if (pageLoading) {
                pageLoading.style.display = 'none';
            }
        });
    })();
    
    // Event Listeners
    if (messageForm) {
        messageForm.addEventListener("submit", handleMessageSubmit);
    }
    
    if (solutionModeButtons.length > 0) {
        solutionModeButtons.forEach(button => {
            button.addEventListener("click", function() {
                const mode = this.getAttribute("data-mode");
                currentSolutionMode = mode;
                updateSolutionModeButtons(mode);
            });
        });
    }
    
    if (modeSelect) {
        modeSelect.addEventListener("change", function() {
            const mode = this.value;
            // Hiển thị hoặc ẩn solution mode tùy thuộc vào chế độ
            if (mode === "giải bài tập") {
                solutionModeContainer.style.display = "block";
                solutionModeLabel.style.display = "block";
            } else {
                solutionModeContainer.style.display = "none";
                solutionModeLabel.style.display = "none";
            }
        });
        
        // Kích hoạt ngay để cập nhật UI
        modeSelect.dispatchEvent(new Event('change'));
    }
    
    if (document.getElementById("toggle-math-button")) {
        document.getElementById("toggle-math-button").addEventListener("click", toggleMathInput);
    }
    
    if (document.getElementById("insert-math-button")) {
        document.getElementById("insert-math-button").addEventListener("click", insertMathExpression);
    }
    
    if (document.getElementById("toggleDarkModeButton")) {
        document.getElementById("toggleDarkModeButton").addEventListener("click", toggleDarkMode);
    }
    
    if (imageUploadButton) {
        imageUploadButton.addEventListener("click", toggleImageUpload);
    }
    
    if (imageInput) {
        imageInput.addEventListener("change", handleImagePreview);
    }
    
    if (clearPreviewButton) {
        clearPreviewButton.addEventListener("click", function() {
            imagePreview.src = "";
            imagePreviewContainer.classList.add("d-none");
            imageInput.value = "";
        });
    }
    
    if (processImageButton) {
        processImageButton.addEventListener("click", processImage);
    }
    
    if (document.getElementById("open-camera-button")) {
        document.getElementById("open-camera-button").addEventListener("click", openCamera);
    }
    
    if (document.getElementById("capture-photo")) {
        document.getElementById("capture-photo").addEventListener("click", takePhoto);
    }
    
    // Functions
    function updateSolutionModeButtons(mode) {
        solutionModeButtons.forEach(button => {
            const buttonMode = button.getAttribute("data-mode");
            if (buttonMode === mode) {
                button.classList.add("active");
            } else {
                button.classList.remove("active");
            }
        });
    }
    
    function initializeMathQuill() {
        try {
            var MQ = MathQuill.getInterface(2);
            var mathField = MQ.MathField(mathInput, {
                spaceBehavesLikeTab: true,
                handlers: {
                    edit: function() {
                        const latex = mathField.latex();
                        updateMathPreview(latex);
                    }
                }
            });
            
            // Ensure we update the preview immediately
            updateMathPreview(mathField.latex());
        } catch (e) {
            console.error("MathQuill initialization error:", e);
        }
    }
    
    function updateMathPreview(latex) {
        try {
            if (mathPreview) {
                // Cập nhật thẻ span với mã LaTeX để MathJax hiển thị
                mathPreview.textContent = '\\(' + latex + '\\)';
                
                // Nếu MathJax đã tải, kích hoạt render
                if (typeof MathJax !== 'undefined') {
                    MathJax.typesetPromise([mathPreview]).catch(err => console.error("MathJax error:", err));
                }
            }
        } catch (e) {
            console.error("Error updating math preview:", e);
        }
    }
    
    function toggleMathInput() {
        const mathInputContainer = document.getElementById("math-input-container");
        if (mathInputContainer.classList.contains("d-none")) {
            mathInputContainer.classList.remove("d-none");
        } else {
            mathInputContainer.classList.add("d-none");
        }
    }
    
    function insertMathExpression() {
        try {
            const latex = document.getElementById("math-input").getAttribute("data-latex") || "";
            if (latex && userInput) {
                const cursorPos = userInput.selectionStart;
                const textBefore = userInput.value.substring(0, cursorPos);
                const textAfter = userInput.value.substring(cursorPos);
                
                // Format for LaTeX: use $$ delimiters
                userInput.value = textBefore + " $$" + latex + "$$ " + textAfter;
                
                // Reset math input and close container
                document.getElementById("math-input-container").classList.add("d-none");
                
                // Set focus back to the message input
                userInput.focus();
                userInput.selectionStart = userInput.selectionEnd = cursorPos + latex.length + 5; // +5 for the $$ delimiters and spaces
            }
        } catch (e) {
            console.error("Error inserting math expression:", e);
        }
    }
    
    function toggleDarkMode() {
        if (isDarkMode) {
            disableDarkMode();
            isDarkMode = false;
            localStorage.setItem('darkMode', 'disabled');
        } else {
            enableDarkMode();
            isDarkMode = true;
            localStorage.setItem('darkMode', 'enabled');
        }
    }
    
    function enableDarkMode() {
        document.body.classList.add('dark-mode');
        // Cập nhật icon và text
        const darkModeText = document.getElementById('darkModeText');
        if (darkModeText) {
            darkModeText.textContent = 'Chế độ sáng';
        }
        // Thay đổi icon từ mặt trăng sang mặt trời
        const darkModeIcon = document.querySelector('#toggleDarkModeButton i');
        if (darkModeIcon) {
            darkModeIcon.className = 'fas fa-sun me-1';
        }
    }
    
    function disableDarkMode() {
        document.body.classList.remove('dark-mode');
        // Cập nhật icon và text
        const darkModeText = document.getElementById('darkModeText');
        if (darkModeText) {
            darkModeText.textContent = 'Chế độ tối';
        }
        // Thay đổi icon từ mặt trời sang mặt trăng
        const darkModeIcon = document.querySelector('#toggleDarkModeButton i');
        if (darkModeIcon) {
            darkModeIcon.className = 'fas fa-moon me-1';
        }
    }
    
    async function handleMessageSubmit(e) {
        e.preventDefault();
        
        const message = userInput.value.trim();
        if (!message) return;
        
        // Lấy giá trị từ các select
        const subject = subjectSelect ? subjectSelect.value : "chung";
        const mode = modeSelect ? modeSelect.value : "giải bài tập";
        
        // Tạo tin nhắn của người dùng
        const userMessageElement = document.createElement("div");
        userMessageElement.className = "message user-message";
        
        const userAvatarDiv = document.createElement("div");
        userAvatarDiv.className = "message-avatar user-avatar";
        
        const userContentDiv = document.createElement("div");
        userContentDiv.className = "message-content";
        userContentDiv.innerHTML = formatMessage(message);
        
        userMessageElement.appendChild(userAvatarDiv);
        userMessageElement.appendChild(userContentDiv);
        chatArea.appendChild(userMessageElement);
        
        // Đánh dấu đang gửi
        const typingIndicator = document.createElement("div");
        typingIndicator.className = "message bot-message typing-indicator";
        
        const botAvatarDiv = document.createElement("div");
        botAvatarDiv.className = "message-avatar bot-avatar";
        
        const dotsContainer = document.createElement("div");
        dotsContainer.className = "typing-dots";
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement("span");
            dot.className = "dot";
            dotsContainer.appendChild(dot);
        }
        
        typingIndicator.appendChild(botAvatarDiv);
        typingIndicator.appendChild(dotsContainer);
        chatArea.appendChild(typingIndicator);
        
        // Clear input
        userInput.value = "";
        scrollToBottom();
        
        try {
            const response = await fetch("/send_message", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: message,
                    subject: subject,
                    mode: mode,
                    solution_mode: currentSolutionMode
                }),
            });
            
            const data = await response.json();
            
            // Xóa typing indicator
            chatArea.removeChild(typingIndicator);
            
            if (response.ok) {
                // Tạo tin nhắn phản hồi của bot
                const botMessageElement = document.createElement("div");
                botMessageElement.className = "message bot-message";
                
                const botAvatarDiv = document.createElement("div");
                botAvatarDiv.className = "message-avatar bot-avatar";
                
                const botContentDiv = document.createElement("div");
                botContentDiv.className = "message-content";
                botContentDiv.innerHTML = formatMessage(data.response);
                
                botMessageElement.appendChild(botAvatarDiv);
                botMessageElement.appendChild(botContentDiv);
                chatArea.appendChild(botMessageElement);
                
                // Format math nếu có MathJax
                if (typeof MathJax !== 'undefined') {
                    MathJax.typesetPromise([botContentDiv]).catch(err => console.error('MathJax error:', err));
                }
            } else {
                addErrorMessage(data.error || "Có lỗi xảy ra khi xử lý tin nhắn của bạn.");
            }
        } catch (error) {
            // Xóa typing indicator nếu vẫn còn
            if (typingIndicator.parentNode) {
                chatArea.removeChild(typingIndicator);
            }
            
            console.error("Error:", error);
            addErrorMessage("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
        }
        
        scrollToBottom();
    }
    
    function addErrorMessage(text) {
        const errorMessageElement = document.createElement("div");
        errorMessageElement.className = "message error-message";
        
        const errorContentDiv = document.createElement("div");
        errorContentDiv.className = "message-content";
        errorContentDiv.textContent = text;
        
        errorMessageElement.appendChild(errorContentDiv);
        chatArea.appendChild(errorMessageElement);
    }
    
    function formatMessage(text) {
        if (!text) return "";
        
        let safeText = text;
        
        // Lưu trữ code blocks để tránh xung đột với các thay thế khác
        const codeBlocks = [];
        
        // 1. Protect code blocks
        safeText = safeText.replace(/```([\s\S]*?)```/g, function(match) {
            codeBlocks.push(match);
            return `%%CODEBLOCK${codeBlocks.length - 1}%%`;
        });
        
        // 2. Xử lý xuống dòng
        safeText = safeText.replace(/\n/g, '<br>');
        
        // 3. Format headings (# Heading -> <h3>Heading</h3>)
        if (!safeText.includes('%%CODEBLOCK')) {
            safeText = safeText.replace(/^# (.*?)$/gm, '<h3>$1</h3>');
            safeText = safeText.replace(/^## (.*?)$/gm, '<h4>$1</h4>');
            safeText = safeText.replace(/^### (.*?)$/gm, '<h5>$1</h5>');
            
            // 4. Format lists
            safeText = safeText.replace(/^\* (.*?)$/gm, '<li>$1</li>');
            safeText = safeText.replace(/^- (.*?)$/gm, '<li>$1</li>');
            safeText = safeText.replace(/^(\d+)\. (.*?)$/gm, '<li>$1. $2</li>');
            
            // 5. Basic markdown
            safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            safeText = safeText.replace(/\*(.*?)\*/g, '<em>$1</em>');
            
            // Restore code blocks
            safeText = safeText.replace(/%%CODEBLOCK(\d+)%%/g, function(match, index) {
                return codeBlocks[parseInt(index)];
            });
        }
        
        // 6. Format code blocks and inline code
        safeText = safeText.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        safeText = safeText.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // 7. Special format for "---GIẢI THÍCH---" and "---GIẢI THÍCH TỪNG BƯỚC---"
        safeText = safeText.replace(/---GIẢI THÍCH---/g, '<div class="solution-separator">GIẢI THÍCH</div>');
        safeText = safeText.replace(/---GIẢI THÍCH TỪNG BƯỚC---/g, '<div class="solution-separator">GIẢI THÍCH TỪNG BƯỚC</div>');
        
        return safeText;
    }

    function scrollToBottom() {
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    function initializeChat() {
        console.log("Initializing chat...");
        if (chatArea) {
            // Xóa tất cả tin nhắn hiện có để đảm bảo chat rỗng khi khởi động
            while (chatArea.firstChild) {
                chatArea.removeChild(chatArea.firstChild);
            }
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
                while (chatArea.firstChild) {
                    chatArea.removeChild(chatArea.firstChild);
                }
            } else {
                console.error('Error:', data.error);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    function toggleImageUpload() {
        const uploadContainer = document.getElementById("upload-container");
        if (uploadContainer.classList.contains("d-none")) {
            uploadContainer.classList.remove("d-none");
        } else {
            uploadContainer.classList.add("d-none");
        }
    }

    function handleImagePreview(e) {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreviewContainer.classList.remove("d-none");
            }
            
            reader.readAsDataURL(e.target.files[0]);
        }
    }

    async function processImage() {
        if (!imageInput.files || !imageInput.files[0]) {
            alert("Vui lòng chọn một hình ảnh");
            return;
        }
        
        progressContainer.classList.remove("d-none");
        progressBar.style.width = "0%";
        processImageButton.disabled = true;
        
        const formData = new FormData();
        formData.append("image", imageInput.files[0]);
        formData.append("subject", subjectSelect ? subjectSelect.value : "chung");
        formData.append("mode", modeSelect ? modeSelect.value : "giải bài tập");
        formData.append("solution_mode", currentSolutionMode);
        
        try {
            // Simulation of progress
            let progress = 0;
            const interval = setInterval(() => {
                progress += 5;
                progressBar.style.width = `${Math.min(progress, 90)}%`;
                if (progress >= 90) clearInterval(interval);
            }, 200);
            
            const response = await fetch("/upload_image", {
                method: "POST",
                body: formData
            });
            
            const data = await response.json();
            
            // Clear simulation and show 100%
            clearInterval(interval);
            progressBar.style.width = "100%";
            
            setTimeout(() => {
                progressContainer.classList.add("d-none");
                processImageButton.disabled = false;
                
                if (response.ok) {
                    // Hide upload container
                    document.getElementById("upload-container").classList.add("d-none");
                    
                    // Reset file input and preview
                    imageInput.value = "";
                    imagePreviewContainer.classList.add("d-none");
                    
                    // Create image message
                    const userMessageElement = document.createElement("div");
                    userMessageElement.className = "message user-message";
                    
                    const userAvatarDiv = document.createElement("div");
                    userAvatarDiv.className = "message-avatar user-avatar";
                    
                    const userContentDiv = document.createElement("div");
                    userContentDiv.className = "message-content";
                    
                    // Add a small preview of the image
                    const imagePreviewElement = document.createElement("div");
                    imagePreviewElement.className = "user-image-preview";
                    
                    const imgElement = document.createElement("img");
                    imgElement.src = data.original_image;
                    imgElement.alt = "Ảnh đã tải lên";
                    imgElement.classList.add("img-thumbnail");
                    imgElement.style.maxHeight = "150px";
                    
                    imagePreviewElement.appendChild(imgElement);
                    userContentDiv.appendChild(imagePreviewElement);
                    userMessageElement.appendChild(userAvatarDiv);
                    userMessageElement.appendChild(userContentDiv);
                    chatArea.appendChild(userMessageElement);
                    
                    // Create bot response message
                    const botMessageElement = document.createElement("div");
                    botMessageElement.className = "message bot-message";
                    
                    const botAvatarDiv = document.createElement("div");
                    botAvatarDiv.className = "message-avatar bot-avatar";
                    
                    const botContentDiv = document.createElement("div");
                    botContentDiv.className = "message-content";
                    botContentDiv.innerHTML = formatMessage(data.response);
                    
                    botMessageElement.appendChild(botAvatarDiv);
                    botMessageElement.appendChild(botContentDiv);
                    chatArea.appendChild(botMessageElement);
                    
                    scrollToBottom();
                    
                    // Format math if MathJax is available
                    if (typeof MathJax !== 'undefined') {
                        MathJax.typesetPromise([botContentDiv]).catch(err => console.error('MathJax error:', err));
                    }
                } else {
                    alert(data.error || "Có lỗi xảy ra khi xử lý hình ảnh");
                }
            }, 500);
        } catch (error) {
            progressContainer.classList.add("d-none");
            processImageButton.disabled = false;
            console.error("Error:", error);
            alert("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
        }
    }

    function openCamera() {
        const videoContainer = document.getElementById("video-container");
        const videoElement = document.getElementById("camera-video");
        
        if (videoContainer.classList.contains("d-none")) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(function(stream) {
                    videoElement.srcObject = stream;
                    videoContainer.classList.remove("d-none");
                })
                .catch(function(err) {
                    console.error("Error accessing camera:", err);
                    alert("Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập và thử lại.");
                });
        } else {
            // Stop camera stream
            const stream = videoElement.srcObject;
            if (stream) {
                const tracks = stream.getTracks();
                tracks.forEach(track => track.stop());
                videoElement.srcObject = null;
            }
            videoContainer.classList.add("d-none");
        }
    }

    function takePhoto() {
        const videoElement = document.getElementById("camera-video");
        const videoContainer = document.getElementById("video-container");
        
        // Create a canvas element to capture the image
        const canvas = document.createElement("canvas");
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        // Convert to file
        canvas.toBlob(function(blob) {
            const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
            
            // Create a DataTransfer object to simulate a file input
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            imageInput.files = dataTransfer.files;
            
            // Update preview
            imagePreview.src = canvas.toDataURL("image/jpeg");
            imagePreviewContainer.classList.remove("d-none");
            
            // Stop camera stream
            const stream = videoElement.srcObject;
            if (stream) {
                const tracks = stream.getTracks();
                tracks.forEach(track => track.stop());
                videoElement.srcObject = null;
            }
            videoContainer.classList.add("d-none");
        }, "image/jpeg");
    }
    
    // Initialize event listeners for the custom buttons
    document.getElementById('toggleDarkModeButton')?.addEventListener('click', toggleDarkMode);
    document.getElementById('image-upload-button')?.addEventListener('click', toggleImageUpload);
    
    // Reference to the clear-chat-button element in HTML
    // Đã loại bỏ liên kết này để nút "Xóa lịch sử" không hoạt động
    // document.getElementById('clear-chat-button')?.addEventListener('click', clearChatHistory);
    
    // Check if Bootstrap Modal is available
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        console.log("Bootstrap Modal is available");
    } else {
        console.warn("Bootstrap Modal not available");
    }

    // Let others know DOM is ready
    console.log("DOM fully loaded, initializing application...");
});
