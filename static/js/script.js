document.addEventListener("DOMContentLoaded", function() {
    // DOM elements
    const chatForm = document.getElementById("chat-form");
    const chatArea = document.getElementById("chat-area");
    const messageInput = document.getElementById("message-input");
    const sendButton = document.getElementById("send-button");
    const loadingOverlay = document.getElementById("loadingOverlay");
    const mathInput = document.getElementById("math-input");
    const mathPreview = document.getElementById("math-preview");
    const insertMathButton = document.getElementById("insertMathButton");
    const toggleMathButton = document.getElementById("toggleMathButton");
    const toggleImageButton = document.getElementById("toggleImageButton");
    const imageInput = document.getElementById("imageInput");
    const imagePreview = document.getElementById("imagePreview");
    const imagePreviewContainer = document.getElementById("imagePreviewContainer");
    const removeImageButton = document.getElementById("removeImageButton");
    const processImageButton = document.getElementById("processImageButton");
    const toggleDarkModeButton = document.getElementById("toggleDarkModeButton");
    const cameraTrigger = document.getElementById("openCameraButton");
    const closeStreamButton = document.getElementById("closeStreamButton");
    const takePhotoButton = document.getElementById("takePhotoButton");
    const cameraFeed = document.getElementById("cameraFeed");
    const cameraCanvas = document.getElementById("cameraCanvas");
    let mathField;
    let stream = null;
    
    // Get solution mode buttons
    const solutionModeButtons = document.querySelectorAll('.solution-mode-btn');
    let currentSolutionMode = 'full'; // Default mode
    
    // Subject options
    const subjectSelect = document.getElementById("subject-select");
    const modeSelect = document.getElementById("mode-select");
    const subjectOptions = document.getElementById("subject-options");
    const modeOptions = document.getElementById("mode-options");
    
    // Check for dark mode preference
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    
    // Initialize when DOM is loaded
    if (chatForm) {
        chatForm.addEventListener("submit", handleMessageSubmit);
    } else {
        console.warn("Chat form not found");
    }
    
    if (toggleMathButton) {
        toggleMathButton.addEventListener("click", toggleMathInput);
    }
    
    if (insertMathButton) {
        insertMathButton.addEventListener("click", insertMathExpression);
    }
    
    if (toggleDarkModeButton) {
        toggleDarkModeButton.addEventListener("click", toggleDarkMode);
    }
    
    if (toggleImageButton) {
        toggleImageButton.addEventListener("click", toggleImageUpload);
    }
    
    if (imageInput) {
        imageInput.addEventListener("change", handleImagePreview);
    }
    
    if (removeImageButton) {
        removeImageButton.addEventListener("click", function() {
            imagePreview.src = "";
            imageInput.value = "";
            imagePreviewContainer.classList.add("d-none");
        });
    }
    
    if (processImageButton) {
        processImageButton.addEventListener("click", processImage);
    }
    
    if (cameraTrigger) {
        cameraTrigger.addEventListener("click", openCamera);
    }
    
    if (closeStreamButton) {
        closeStreamButton.addEventListener("click", function() {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                cameraFeed.srcObject = null;
            }
            document.getElementById("cameraControls").classList.add("d-none");
        });
    }
    
    if (takePhotoButton) {
        takePhotoButton.addEventListener("click", takePhoto);
    }
    
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
    
    // Set up solution mode buttons
    solutionModeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const mode = this.getAttribute('data-mode');
            currentSolutionMode = mode;
            updateSolutionModeButtons(mode);
        });
    });
    
    // Initialize solution mode buttons
    updateSolutionModeButtons(currentSolutionMode);
    
    function updateSolutionModeButtons(mode) {
        solutionModeButtons.forEach(btn => {
            if (btn.getAttribute('data-mode') === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    function initializeMathQuill() {
        const mathInputField = document.getElementById("math-input-field");
        if (!mathInputField) return;
        
        mathField = MQ.MathField(mathInputField, {
            spaceBehavesLikeTab: true,
            handlers: {
                edit: function() {
                    updateMathPreview(mathField.latex());
                }
            }
        });
    }
    
    function updateMathPreview(latex) {
        if (mathPreview) {
            mathPreview.textContent = latex;
            
            try {
                // Use KaTeX to render the preview
                katex.render(latex, mathPreview, {
                    throwOnError: false
                });
            } catch (e) {
                mathPreview.textContent = "Lỗi hiển thị công thức: " + e.message;
            }
        }
    }
    
    function toggleMathInput() {
        const mathInputContainer = document.getElementById("math-input-container");
        if (mathInputContainer.classList.contains("d-none")) {
            mathInputContainer.classList.remove("d-none");
            insertMathButton.classList.remove("d-none");
            setTimeout(() => {
                if (mathField) {
                    mathField.focus();
                }
            }, 100);
        } else {
            mathInputContainer.classList.add("d-none");
            insertMathButton.classList.add("d-none");
        }
    }
    
    function insertMathExpression() {
        if (mathField && messageInput) {
            const latex = mathField.latex();
            const cursorPos = messageInput.selectionStart;
            const textBefore = messageInput.value.substring(0, cursorPos);
            const textAfter = messageInput.value.substring(cursorPos);
            
            // Insert LaTeX surrounded by dollar signs
            messageInput.value = textBefore + " $" + latex + "$ " + textAfter;
            
            // Update cursor position to be after the inserted equation
            const newPosition = cursorPos + latex.length + 3; // +3 for the space and dollar signs
            messageInput.selectionStart = newPosition;
            messageInput.selectionEnd = newPosition;
            messageInput.focus();
            
            // Hide math input after inserting
            document.getElementById("math-input-container").classList.add("d-none");
            insertMathButton.classList.add("d-none");
        }
    }
    
    function toggleDarkMode() {
        const isDarkModeEnabled = localStorage.getItem('darkMode') === 'true';
        
        if (isDarkModeEnabled) {
            disableDarkMode();
            localStorage.setItem('darkMode', 'false');
        } else {
            enableDarkMode();
            localStorage.setItem('darkMode', 'true');
        }
    }
    
    function enableDarkMode() {
        document.body.classList.add('dark-mode');
        document.querySelectorAll('.card, .navbar, .btn-outline-secondary, .form-control, .form-select').forEach(el => {
            el.classList.add('dark-element');
        });
        
        if (toggleDarkModeButton) {
            toggleDarkModeButton.innerHTML = '<i class="fas fa-sun me-1"></i><span id="darkModeText">Chế độ sáng</span>';
        }
    }
    
    function disableDarkMode() {
        document.body.classList.remove('dark-mode');
        document.querySelectorAll('.card, .navbar, .btn-outline-secondary, .form-control, .form-select').forEach(el => {
            el.classList.remove('dark-element');
        });
        
        if (toggleDarkModeButton) {
            toggleDarkModeButton.innerHTML = '<i class="fas fa-moon me-1"></i><span id="darkModeText">Chế độ tối</span>';
        }
    }
    
    async function handleMessageSubmit(e) {
        e.preventDefault();
        
        const messageText = messageInput.value.trim();
        const imageFile = imageInput.files[0];
        
        // Validate input: Check if message is empty and no image is selected
        if (!messageText && !imageFile) {
            addErrorMessage("Vui lòng nhập câu hỏi hoặc chọn ảnh để gửi.");
            return;
        }
        
        // Reset form and hide image preview after submitting
        if (messageText) {
            // Create user message element
            const userMessageElement = document.createElement("div");
            userMessageElement.className = "message user-message";
            
            const userAvatarDiv = document.createElement("div");
            userAvatarDiv.className = "message-avatar user-avatar";
            
            const userContentDiv = document.createElement("div");
            userContentDiv.className = "message-content";
            userContentDiv.innerHTML = formatMessage(messageText);
            
            userMessageElement.appendChild(userAvatarDiv);
            userMessageElement.appendChild(userContentDiv);
            chatArea.appendChild(userMessageElement);
            
            // Clear input
            messageInput.value = "";
            scrollToBottom();
        }
        
        // Check if image file is selected
        if (imageFile) {
            // Create image message
            const userMessageElement = document.createElement("div");
            userMessageElement.className = "message user-message";
            
            const userAvatarDiv = document.createElement("div");
            userAvatarDiv.className = "message-avatar user-avatar";
            
            const userContentDiv = document.createElement("div");
            userContentDiv.className = "message-content";
            
            // Add image in message
            const imageElement = document.createElement("img");
            imageElement.src = URL.createObjectURL(imageFile);
            imageElement.className = "user-image-upload img-fluid mb-2 rounded";
            imageElement.style.maxHeight = "200px";
            
            userContentDiv.appendChild(imageElement);
            if (messageText) {
                const textParagraph = document.createElement("p");
                textParagraph.innerHTML = formatMessage(messageText);
                userContentDiv.appendChild(textParagraph);
            }
            
            userMessageElement.appendChild(userAvatarDiv);
            userMessageElement.appendChild(userContentDiv);
            chatArea.appendChild(userMessageElement);
            
            // Clear image input and hide preview
            imageInput.value = "";
            imagePreview.src = "";
            imagePreviewContainer.classList.add("d-none");
            document.getElementById("upload-container").classList.add("d-none");
            
            scrollToBottom();
        }
        
        // Show loading overlay
        loadingOverlay.classList.remove("d-none");
        
        try {
            // Get selected options
            const selectedSubject = subjectSelect ? subjectSelect.value : 'general';
            const selectedMode = modeSelect ? modeSelect.value : 'assistant';
            
            // Form data for image upload
            const formData = new FormData();
            if (messageText) {
                formData.append("message", messageText);
            }
            if (imageFile) {
                formData.append("image", imageFile);
            }
            formData.append("subject", selectedSubject);
            formData.append("mode", selectedMode);
            formData.append("solution_mode", currentSolutionMode);
            
            // Determine which endpoint to use
            const endpoint = imageFile ? '/upload_image' : '/send_message';
            
            // Send request
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            // Hide loading overlay
            loadingOverlay.classList.add("d-none");
            
            if (response.ok) {
                // Create AI message element
                const aiMessageElement = document.createElement("div");
                aiMessageElement.className = "message ai-message";
                
                const aiAvatarDiv = document.createElement("div");
                aiAvatarDiv.className = "message-avatar ai-avatar";
                
                const aiContentDiv = document.createElement("div");
                aiContentDiv.className = "message-content";
                aiContentDiv.innerHTML = formatMessage(data.response);
                
                aiMessageElement.appendChild(aiAvatarDiv);
                aiMessageElement.appendChild(aiContentDiv);
                chatArea.appendChild(aiMessageElement);
                
                // Add special styling for code blocks for better readability
                document.querySelectorAll('pre code').forEach(block => {
                    block.classList.add('p-2', 'bg-light', 'rounded');
                });
                
                scrollToBottom();
            } else {
                addErrorMessage(data.error || "Có lỗi xảy ra khi xử lý yêu cầu của bạn.");
            }
        } catch (error) {
            console.error("Error:", error);
            loadingOverlay.classList.add("d-none");
            addErrorMessage("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
        }
    }
    
    function addErrorMessage(text) {
        const errorMessageElement = document.createElement("div");
        errorMessageElement.className = "alert alert-danger mt-3";
        errorMessageElement.textContent = text;
        chatArea.appendChild(errorMessageElement);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            errorMessageElement.remove();
        }, 5000);
        
        scrollToBottom();
    }
    
    function formatMessage(text) {
        if (!text) return "";
        
        // Save code blocks temporarily to avoid formatting them
        const codeBlocks = [];
        let safeText = text.replace(/```([\s\S]*?)```/g, function(match) {
            codeBlocks.push(match);
            return "%%CODEBLOCK" + (codeBlocks.length-1) + "%%";
        });
        
        // 1. Convert line breaks to <br>
        safeText = safeText.replace(/\n/g, '<br>');
        
        // 2. Convert LaTeX delimited by $ to rendered math
        if (!safeText.includes('%%CODEBLOCK')) {
            // Find all LaTeX expressions
            const latexPattern = /\$(.*?)\$/g;
            const latexMatches = safeText.match(latexPattern);
            
            if (latexMatches) {
                for (let match of latexMatches) {
                    // Extract LaTeX content
                    const latex = match.slice(1, -1);
                    
                    try {
                        // Create temporary element to hold rendered LaTeX
                        const tempElement = document.createElement('span');
                        katex.render(latex, tempElement, {
                            throwOnError: false,
                            displayMode: false
                        });
                        
                        // Replace with rendered LaTeX
                        safeText = safeText.replace(match, tempElement.outerHTML);
                    } catch (e) {
                        console.error("Error rendering LaTeX:", e);
                        // Keep original if rendering fails
                    }
                }
            }
        }
        
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
        // Chỉ xóa khu vực chat và không thêm tin nhắn chào mừng nữa
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
        const file = imageInput.files[0];
        if (!file) {
            addErrorMessage("Vui lòng chọn ảnh để xử lý.");
            return;
        }
        
        // Create form data
        const formData = new FormData();
        formData.append("image", file);
        
        // Show loading overlay
        loadingOverlay.classList.remove("d-none");
        
        try {
            const response = await fetch('/upload_image', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            // Hide loading overlay
            loadingOverlay.classList.add("d-none");
            
            if (response.ok) {
                // Create image message
                const userMessageElement = document.createElement("div");
                userMessageElement.className = "message user-message";
                
                const userAvatarDiv = document.createElement("div");
                userAvatarDiv.className = "message-avatar user-avatar";
                
                const userContentDiv = document.createElement("div");
                userContentDiv.className = "message-content";
                
                // Add image in message
                const imageElement = document.createElement("img");
                imageElement.src = URL.createObjectURL(file);
                imageElement.className = "user-image-upload img-fluid mb-2 rounded";
                imageElement.style.maxHeight = "200px";
                
                userContentDiv.appendChild(imageElement);
                
                userMessageElement.appendChild(userAvatarDiv);
                userMessageElement.appendChild(userContentDiv);
                chatArea.appendChild(userMessageElement);
                
                // Create AI response message
                const aiMessageElement = document.createElement("div");
                aiMessageElement.className = "message ai-message";
                
                const aiAvatarDiv = document.createElement("div");
                aiAvatarDiv.className = "message-avatar ai-avatar";
                
                const aiContentDiv = document.createElement("div");
                aiContentDiv.className = "message-content";
                aiContentDiv.innerHTML = formatMessage(data.response);
                
                aiMessageElement.appendChild(aiAvatarDiv);
                aiMessageElement.appendChild(aiContentDiv);
                chatArea.appendChild(aiMessageElement);
                
                // Clear form
                imageInput.value = "";
                imagePreview.src = "";
                imagePreviewContainer.classList.add("d-none");
                document.getElementById("upload-container").classList.add("d-none");
                
                scrollToBottom();
            } else {
                addErrorMessage(data.error || "Có lỗi xảy ra khi xử lý ảnh của bạn.");
            }
        } catch (error) {
            console.error("Error:", error);
            loadingOverlay.classList.add("d-none");
            addErrorMessage("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
        }
    }

    function openCamera() {
        // Check if camera is already open
        if (stream) {
            document.getElementById("cameraControls").classList.remove("d-none");
            return;
        }
        
        // Check for camera support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            addErrorMessage("Trình duyệt của bạn không hỗ trợ truy cập camera.");
            return;
        }
        
        // Request camera access
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(function(s) {
                stream = s;
                cameraFeed.srcObject = stream;
                document.getElementById("cameraControls").classList.remove("d-none");
            })
            .catch(function(error) {
                console.error("Camera error:", error);
                addErrorMessage("Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.");
            });
    }

    function takePhoto() {
        if (!stream) return;
        
        const context = cameraCanvas.getContext('2d');
        
        // Set canvas dimensions to match video
        cameraCanvas.width = cameraFeed.videoWidth;
        cameraCanvas.height = cameraFeed.videoHeight;
        
        // Draw video frame on canvas
        context.drawImage(cameraFeed, 0, 0, cameraCanvas.width, cameraCanvas.height);
        
        // Convert canvas to Blob
        cameraCanvas.toBlob(function(blob) {
            // Create a File object
            const file = new File([blob], "camera_photo.jpg", { type: "image/jpeg" });
            
            // Convert to DataURL for preview
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreviewContainer.classList.remove("d-none");
            }
            reader.readAsDataURL(file);
            
            // Create a new File list to replace the existing file input
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            imageInput.files = dataTransfer.files;
            
            // Hide camera controls and stop stream
            document.getElementById("cameraControls").classList.add("d-none");
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
            }
            
            // Show upload container
            document.getElementById("upload-container").classList.remove("d-none");
        }, 'image/jpeg', 0.95);
    }
});
