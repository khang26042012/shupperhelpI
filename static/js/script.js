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
    const isDarkMode = localStorage.getItem("darkMode") === "enabled";
    if (isDarkMode) {
        enableDarkMode();
    }

    // Initialization
    let activeSolutionMode = "full"; // Default solution mode
    let mathField;

    // MathQuill initialization
    if (typeof MathQuill !== 'undefined') {
        initializeMathQuill();
    } else {
        console.warn("MathQuill not loaded");
    }

    // Event Listeners 
    if (messageForm) messageForm.addEventListener("submit", handleMessageSubmit);
    if (uploadForm) uploadForm.addEventListener("submit", function(e) { e.preventDefault(); });
    if (darkModeToggle) darkModeToggle.addEventListener("click", toggleDarkMode);
    if (imageInput) imageInput.addEventListener("change", handleImagePreview);
    if (clearPreviewButton) clearPreviewButton.addEventListener("click", function() {
        imagePreviewContainer.classList.add("d-none");
        imagePreview.src = "";
        imageInput.value = "";
    });
    if (imageUploadButton) imageUploadButton.addEventListener("click", toggleImageUpload);
    if (processImageButton) processImageButton.addEventListener("click", processImage);
    if (modeSelect) {
        modeSelect.addEventListener("change", function() {
            const mode = modeSelect.value;
            if (mode === "giải bài tập") {
                solutionModeContainer.classList.remove("d-none");
            } else {
                solutionModeContainer.classList.add("d-none");
            }
        });
    }

    // Solution mode buttons
    solutionModeButtons.forEach(button => {
        button.addEventListener("click", function() {
            const mode = this.getAttribute("data-mode");
            updateSolutionModeButtons(mode);
        });
    });

    // Modify HTML for accessibility
    if (subjectLabel) subjectLabel.setAttribute("for", "subject-select");
    if (modeLabel) modeLabel.setAttribute("for", "mode-select");
    if (solutionModeLabel) solutionModeLabel.setAttribute("for", "solution-mode-container");

    // Functions
    function updateSolutionModeButtons(mode) {
        activeSolutionMode = mode;
        solutionModeButtons.forEach(btn => {
            btn.classList.remove("active");
            if (btn.getAttribute("data-mode") === mode) {
                btn.classList.add("active");
            }
        });
    }

    function initializeMathQuill() {
        const MQ = MathQuill.getInterface(2);
        
        // Create MathQuill field
        const mathInputField = document.getElementById('math-input-field');
        if (mathInputField) {
            mathField = MQ.MathField(mathInputField, {
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
            try {
                katex.render(latex, mathPreview, {
                    throwOnError: false,
                    displayMode: true
                });
            } catch (e) {
                mathPreview.textContent = e;
            }
        }
    }

    function toggleMathInput() {
        if (mathInput) {
            mathInput.classList.toggle("d-none");
            if (!mathInput.classList.contains("d-none")) {
                mathField.focus();
            }
        }
    }

    function insertMathExpression() {
        if (mathField && userInput) {
            const latex = mathField.latex();
            const currentText = userInput.value;
            const cursorPosition = userInput.selectionStart;
            
            // Insert LaTeX code at cursor position
            const mathMarkup = '$' + latex + '$';
            const newText = currentText.substring(0, cursorPosition) + mathMarkup + currentText.substring(cursorPosition);
            userInput.value = newText;
            
            // Hide math input
            mathInput.classList.add("d-none");
            
            // Set focus back to main input
            userInput.focus();
            
            // Move cursor after the inserted expression
            const newCursorPosition = cursorPosition + mathMarkup.length;
            userInput.setSelectionRange(newCursorPosition, newCursorPosition);
        }
    }

    function toggleDarkMode() {
        if (document.body.classList.contains("dark-mode")) {
            disableDarkMode();
        } else {
            enableDarkMode();
        }
    }

    function enableDarkMode() {
        document.body.classList.add("dark-mode");
        localStorage.setItem("darkMode", "enabled");
        if (darkModeToggle) {
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            darkModeToggle.setAttribute("title", "Chuyển sang chế độ sáng");
        }
    }

    function disableDarkMode() {
        document.body.classList.remove("dark-mode");
        localStorage.setItem("darkMode", "disabled");
        if (darkModeToggle) {
            darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            darkModeToggle.setAttribute("title", "Chuyển sang chế độ tối");
        }
    }

    async function handleMessageSubmit(e) {
        e.preventDefault();
        
        const message = userInput.value.trim();
        if (!message) return;

        // Add user message to chat
        addMessage(message, "user");
        
        // Clear input field
        userInput.value = "";
        
        // Get selected mode and subject
        const mode = modeSelect ? modeSelect.value : "giải bài tập";
        const subject = subjectSelect ? subjectSelect.value : "chung";
        
        try {
            // Add a placeholder for the AI response
            const loadingMessage = document.createElement("div");
            loadingMessage.className = "message bot-message";
            loadingMessage.innerHTML = '<div class="message-content"><div class="typing-indicator"><span></span><span></span><span></span></div></div>';
            chatArea.appendChild(loadingMessage);
            scrollToBottom();
            
            // Send message to backend
            const response = await fetch("/send_message", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    message: message,
                    subject: subject,
                    mode: mode,
                    solution_mode: activeSolutionMode
                }),
            });
            
            // Remove loading indicator
            chatArea.removeChild(loadingMessage);
            
            if (response.ok) {
                const data = await response.json();
                addMessage(data.response, "bot");
            } else {
                const errorData = await response.json();
                addErrorMessage(errorData.error || "Đã xảy ra lỗi khi gửi tin nhắn.");
            }
        } catch (error) {
            console.error("Error:", error);
            addErrorMessage("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
        }
        
        scrollToBottom();
    }

    function addMessage(text, sender) {
        const messageDiv = document.createElement("div");
        messageDiv.className = `message ${sender}-message`;
        
        const avatar = document.createElement("div");
        avatar.className = "avatar";
        
        if (sender === "bot") {
            avatar.innerHTML = '<img src="/static/img/bot-avatar.png" alt="AI" class="avatar-img">';
        } else {
            avatar.innerHTML = '<div class="user-avatar-placeholder"><i class="fas fa-user"></i></div>';
        }
        
        const contentDiv = document.createElement("div");
        contentDiv.className = "message-content";
        contentDiv.innerHTML = formatMessage(text);
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        chatArea.appendChild(messageDiv);
    }

    function addErrorMessage(text) {
        const messageDiv = document.createElement("div");
        messageDiv.className = "message error-message";
        
        const avatar = document.createElement("div");
        avatar.className = "avatar";
        avatar.innerHTML = '<div class="error-avatar-placeholder"><i class="fas fa-exclamation-triangle"></i></div>';
        
        const contentDiv = document.createElement("div");
        contentDiv.className = "message-content";
        contentDiv.textContent = text;
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        chatArea.appendChild(messageDiv);
    }

    function formatMessage(text) {
        if (!text) return "";
        
        // Escape HTML to prevent XSS
        let safeText = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
        
        // Format markdown and LaTeX
        // 1. Convert markdown headings
        safeText = safeText.replace(/^###\s+(.+)$/gm, '<h5>$1</h5>');
        safeText = safeText.replace(/^##\s+(.+)$/gm, '<h4>$1</h4>');
        safeText = safeText.replace(/^#\s+(.+)$/gm, '<h3>$1</h3>');
        
        // 2. Convert bold and italic
        safeText = safeText.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
        safeText = safeText.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        safeText = safeText.replace(/\*(.+?)\*/g, '<em>$1</em>');
        
        // 3. Convert lists
        safeText = safeText.replace(/^\s*[\-\*]\s+(.+)$/gm, '<li>$1</li>').replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
        safeText = safeText.replace(/^\s*(\d+)\.\s+(.+)$/gm, '<li>$2</li>').replace(/(<li>.*<\/li>)/gs, '<ol>$1</ol>');
        
        // 4. Convert line breaks
        safeText = safeText.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
        
        // 5. Render LaTeX if available (both inline and display)
        if (typeof katex !== 'undefined') {
            // First, protect code blocks
            const codeBlocks = [];
            safeText = safeText.replace(/```([\s\S]*?)```/g, function(match) {
                codeBlocks.push(match);
                return `%%CODEBLOCK${codeBlocks.length - 1}%%`;
            });
            
            // Then handle LaTeX
            let processedText = '';
            let currentIndex = 0;
            
            // Regular expression to match both inline $...$ and display $$...$$ LaTeX
            const latexRegex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g;
            let match;
            
            while ((match = latexRegex.exec(safeText)) !== null) {
                // Add text before the LaTeX
                processedText += safeText.substring(currentIndex, match.index);
                
                try {
                    const isDisplayMode = match[0].startsWith('$$');
                    const latexContent = isDisplayMode 
                        ? match[0].substring(2, match[0].length - 2) 
                        : match[0].substring(1, match[0].length - 1);
                    
                    const renderedLatex = katex.renderToString(latexContent, {
                        throwOnError: false,
                        displayMode: isDisplayMode
                    });
                    
                    processedText += renderedLatex;
                } catch (e) {
                    // If there's an error in the LaTeX, just use the original text
                    processedText += match[0];
                }
                
                currentIndex = match.index + match[0].length;
            }
            
            // Add any remaining text
            processedText += safeText.substring(currentIndex);
            safeText = processedText;
            
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
            // Không hiển thị tin nhắn chào mừng nữa
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
        document.getElementById('image-upload-section').classList.toggle('d-none');
    }

    function handleImagePreview(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                imagePreview.src = event.target.result;
                imagePreviewContainer.classList.remove("d-none");
                console.log("Ảnh đã được tải lên và hiển thị xem trước");
            };
            reader.readAsDataURL(file);
        }
    }

    async function processImage() {
        if (!imageInput.files[0]) {
            alert("Vui lòng chọn một hình ảnh trước.");
            return;
        }

        console.log("Process Image button clicked");
        console.log("Đang gửi ảnh để xử lý...");

        // Show progress
        progressContainer.classList.remove("d-none");
        progressBar.style.width = "0%";
        
        // Create animation
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            if (progress > 90) clearInterval(interval);
            progressBar.style.width = progress + "%";
        }, 100);

        try {
            const formData = new FormData();
            formData.append('image', imageInput.files[0]);
            
            // Add selected mode and subject
            const mode = modeSelect ? modeSelect.value : "giải bài tập";
            const subject = subjectSelect ? subjectSelect.value : "chung";
            formData.append('mode', mode);
            formData.append('subject', subject);
            formData.append('solution_mode', activeSolutionMode);

            const response = await fetch('/upload_image', {
                method: 'POST',
                body: formData
            });

            // Complete progress animation
            clearInterval(interval);
            progressBar.style.width = "100%";
            
            // Process response
            if (response.ok) {
                const data = await response.json();
                console.log("Ảnh đã được xử lý thành công");
                
                // Add message to chat
                addMessage(`[Ảnh đã tải lên]`, "user");
                addMessage(data.response, "bot");
                
                // Reset form and hide progress
                imagePreviewContainer.classList.add("d-none");
                progressContainer.classList.add("d-none");
                imageInput.value = "";
                document.getElementById('image-upload-section').classList.add('d-none');
                
                scrollToBottom();
            } else {
                const errorData = await response.json();
                console.error("Error:", errorData.error);
                alert("Lỗi: " + (errorData.error || "Không thể xử lý hình ảnh"));
                progressContainer.classList.add("d-none");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Đã xảy ra lỗi khi xử lý hình ảnh. Vui lòng thử lại sau.");
            progressContainer.classList.add("d-none");
        }
    }

    function openCamera() {
        // Get camera modal elements
        const cameraModal = new bootstrap.Modal(document.getElementById('cameraModal'));
        const video = document.getElementById('video');
        const canvas = document.getElementById('canvas');
        const takePhotoButton = document.getElementById('takePhotoButton');
        
        // Check if camera elements exist
        if (!video || !canvas || !takePhotoButton) {
            alert("Không thể truy cập camera. Vui lòng kiểm tra lại thiết bị của bạn.");
            return;
        }
        
        // Open modal
        cameraModal.show();
        
        // Start camera when modal opens
        document.getElementById('cameraModal').addEventListener('shown.bs.modal', function() {
            // Get camera stream
            navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
                .then(function(stream) {
                    video.srcObject = stream;
                })
                .catch(function(err) {
                    console.error("Error accessing camera:", err);
                    alert("Không thể truy cập camera. " + err.message);
                });
        });
        
        // Stop camera when modal closes
        document.getElementById('cameraModal').addEventListener('hidden.bs.modal', function() {
            if (video.srcObject) {
                const tracks = video.srcObject.getTracks();
                tracks.forEach(track => track.stop());
                video.srcObject = null;
            }
        });
        
        // Take photo button
        takePhotoButton.onclick = takePhoto;
    }

    function takePhoto() {
        const video = document.getElementById('video');
        const canvas = document.getElementById('canvas');
        const context = canvas.getContext('2d');
        
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to file
        canvas.toBlob(function(blob) {
            const file = new File([blob], "camera_photo.jpg", { type: "image/jpeg" });
            
            // Create a FileList-like object
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            
            // Set the file to the file input
            imageInput.files = dataTransfer.files;
            
            // Trigger change event to update preview
            const event = new Event('change', { bubbles: true });
            imageInput.dispatchEvent(event);
            
            // Close camera modal
            const cameraModal = bootstrap.Modal.getInstance(document.getElementById('cameraModal'));
            cameraModal.hide();
        }, 'image/jpeg', 0.95);
    }

    // Initialize the app
    window.addEventListener('load', function() {
        console.log("Window fully loaded, hiding page loading indicator");
        document.getElementById('page-loading').style.display = 'none';
        
        // Initialize chat after window fully loaded
        initializeChat();
        
        // Setup click handlers for all buttons
        document.getElementById('math-button')?.addEventListener('click', toggleMathInput);
        document.getElementById('insert-math-button')?.addEventListener('click', insertMathExpression);
        document.getElementById('clear-chat-button')?.addEventListener('click', clearChatHistory);
        document.getElementById('camera-button')?.addEventListener('click', openCamera);
    });

    // Check if Bootstrap Modal is available
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        console.log("Bootstrap Modal is available");
    } else {
        console.warn("Bootstrap Modal not available");
    }

    // Let others know DOM is ready
    console.log("DOM fully loaded, initializing application...");
});
