// virtual-assistant.js - AI Interior Design Assistant for UIManager

export class VirtualAssistant {
    constructor(app) {
        this.app = app; // Reference to the main application instance to access the scene 
        this.isOpen = false; // to track if the assistant is currently open
        this.isTyping = false;
        this.conversationHistory = [];
        this.assistantElement = null;
        this.inputElement = null;
        this.messagesContainer = null;
        this.quickActionInProgress = false; // to track if a quick action is currently being processed

        // Core response library: categorized suggestions and system prompts
        this.responses = {
            greeting: [
                "Hello, I’m AUDREY – your AI interior design assistant. How can I support your space planning today?",
                "Welcome back! AUDREY here. I can help you with layout guidance, lighting suggestions, or furniture tips.",
                "Hi! I'm AUDREY. Ready to optimize your room? Ask me anything about lighting, layout, or color design."
            ],
            furniture: {
                chair: "Consider positioning the chair close to your desk for ergonomic comfort. Ensure ambient light reduces eye strain.",
                table: "Tables work best in open, central areas. Add task lighting above for better usability.",
                bed: "Beds are best placed away from direct light. Add soft textures like pillows and blankets to improve comfort.",
                sofa: "Sofas create inviting spaces. Try placing it opposite a focal point like a TV or central wall.",
                wardrobe: "Place wardrobes along unused wall space. Interior lighting helps with visibility.",
                decorations: "Use decorations to add character. Balance size and texture, and avoid overcrowding surfaces."
            },
            lighting: {
                ambient: "Ambient lighting should create an overall mood. A 0.3–0.5 intensity range is typically ideal.",
                directional: "Directional lights are great for simulating sunlight and even distribution across the room.",
                point: "Point lighting adds local focus and contrast. Place it near highlights or small zones."
            },
            colors: {
                warm: "Warm tones (red, orange, yellow) create a cozy and intimate feel – ideal for living or rest spaces.",
                cool: "Cool tones (blue, green, violet) feel calm and professional – great for workspaces or bathrooms.",
                neutral: "Neutral palettes (white, beige, gray) are timeless and versatile. Add accent colors for contrast."
            },
            tips: [
                "Use the 60-30-10 rule for color balance: 60% dominant, 30% secondary, 10% accent.",
                "Leave at least 60cm of space for walking paths between furniture.",
                "Start by placing large items first, then layer in smaller accessories.",
                "Mix textures (smooth, soft, rough) to enhance visual depth, even with muted colors.",
                "Use multiple lighting layers – ambient, task, and accent – to create flexibility.",
                "Group decorative items in odd numbers (3 or 5) for more natural visual appeal."
            ],
            analysis: [
                "Room analysis complete. The layout feels balanced. You might add greenery for a natural touch.",
                "Lighting levels look well tuned. You could experiment with bolder wall colors for personality.",
                "The layout is functional. Consider defining focal points using artwork or statement pieces.",
                "Great element distribution. Try adding soft textiles like curtains or a rug to finish the space."
            ]
        };

        this.createAssistant();
    }

    // Initializes and adds the assistant UI into the DOM
    createAssistant() {
        this.assistantElement = document.createElement('div');
        this.assistantElement.className = 'virtual-assistant';
        this.assistantElement.innerHTML = `
            <div class="assistant-header" id="assistant-header">
                <div class="assistant-avatar">
                    <div class="avatar-icon">🤖</div>
                    <div class="status-indicator" id="status-indicator"></div>
                </div>
                <div class="assistant-info">
                    <h3>AUDREY</h3>
                    <span class="assistant-status" id="assistant-status">Interior Design Assistant</span>
                </div>
                <div class="assistant-controls">
                    <button class="assistant-btn minimize-btn" id="minimize-btn" title="Minimize or Restore">−</button>
                    <button class="assistant-btn close-btn" id="close-btn" title="Close Assistant">×</button>
                </div>
            </div>
            <div class="assistant-body" id="assistant-body">
                <div class="messages-container" id="messages-container">
                    <div class="welcome-message">
                        <div class="message assistant-message">
                            <div class="message-avatar">🤖</div>
                            <div class="message-content">
                                ${this.getRandomResponse('greeting')}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="input-container">
                    <input type="text" id="assistant-input" placeholder="Ask about layout, lighting, colors, or controls..." maxlength="200">
                    <button id="send-btn" class="send-btn">
                        <span class="send-icon">➤</span>
                    </button>
                </div>
                <div class="quick-actions">
                    <button class="quick-btn" data-action="analyze">Analyze Room</button>
                    <button class="quick-btn" data-action="tips">Design Tips</button>
                    <button class="quick-btn" data-action="help">Help & Controls</button>
                </div>
            </div>
            <div class="assistant-toggle" id="assistant-toggle" title="Open AUDREY Assistant">
                <div class="toggle-icon">🤖</div>
                <div class="notification-badge" id="notification-badge">1</div>
            </div>
        `;

    this.addAssistantStyles();
    document.body.appendChild(this.assistantElement);
    this.bindEvents();
    this.toggleAssistant(false);
    }

    // style of the panel opened when interacting with the AI assistant
    addAssistantStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .virtual-assistant {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 350px;
                height: 500px;
                background: rgba(20, 20, 25, 0.95);
                border: 1px solid rgba(74, 158, 255, 0.3);
                border-radius: 16px;
                backdrop-filter: blur(15px);
                box-shadow: 0 8px 32px rgba(0,0,0,0.6);
                z-index: 10000;
                font-family: 'Segoe UI', sans-serif;
                display: flex;
                flex-direction: column;
                transition: all 0.3s ease;
                transform: translateY(100%);
                opacity: 0;
            }

            .virtual-assistant.open {
                transform: translateY(0);
                opacity: 1;
            }

            .virtual-assistant.minimized {
                height: 60px;
                transform: translateY(calc(100% - 60px));
            }

            .assistant-header {
                display: flex;
                align-items: center;
                padding: 15px;
                border-bottom: 1px solid rgba(74, 158, 255, 0.2);
                background: rgba(74, 158, 255, 0.1);
                border-radius: 16px 16px 0 0;
            }

            .assistant-avatar {
                position: relative;
                margin-right: 12px;
            }

            .avatar-icon {
                width: 40px;
                height: 40px;
                background: linear-gradient(45deg, #667eea, #764ba2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                animation: glow 2s ease-in-out infinite alternate;
            }

            @keyframes glow {
                from { box-shadow: 0 0 5px rgba(102, 126, 234, 0.5); }
                to { box-shadow: 0 0 20px rgba(102, 126, 234, 0.8), 0 0 30px rgba(102, 126, 234, 0.4); }
            }

            .status-indicator {
                position: absolute;
                bottom: 2px;
                right: 2px;
                width: 12px;
                height: 12px;
                background: #4CAF50;
                border: 2px solid #fff;
                border-radius: 50%;
                animation: pulse 2s infinite;
            }

            .assistant-info {
                flex: 1;
                color: white;
            }

            .assistant-info h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: #4a9eff;
            }

            .assistant-status {
                font-size: 12px;
                color: #aaa;
            }

            .assistant-controls {
                display: flex;
                gap: 5px;
            }

            .assistant-btn {
                width: 24px;
                height: 24px;
                border: none;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.1);
                color: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                transition: all 0.2s;
            }

            .assistant-btn:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: scale(1.1);
            }

            .close-btn:hover {
                background: #ff4444;
            }

            .assistant-body {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }

            .messages-container {
                flex: 1;
                overflow-y: auto;
                padding: 15px;
                scroll-behavior: smooth;
            }

            .message {
                display: flex;
                margin-bottom: 15px;
                animation: messageSlide 0.3s ease-out;
            }

            @keyframes messageSlide {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .message-avatar {
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 10px;
                font-size: 16px;
                flex-shrink: 0;
            }

            .assistant-message .message-avatar {
                background: linear-gradient(45deg, #667eea, #764ba2);
            }

            .user-message {
                flex-direction: row-reverse;
            }

            .user-message .message-avatar {
                background: linear-gradient(45deg, #4a9eff, #357abd);
                margin-right: 0;
                margin-left: 10px;
            }

            .message-content {
                background: rgba(255, 255, 255, 0.1);
                padding: 10px 12px;
                border-radius: 12px;
                color: white;
                font-size: 13px;
                line-height: 1.4;
                max-width: 250px;
            }

            .user-message .message-content {
                background: rgba(74, 158, 255, 0.2);
            }

            .typing-indicator {
                display: flex;
                align-items: center;
                gap: 5px;
                padding: 10px 12px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                color: #aaa;
                font-size: 13px;
            }

            .typing-dots {
                display: flex;
                gap: 3px;
            }

            .typing-dot {
                width: 6px;
                height: 6px;
                background: #aaa;
                border-radius: 50%;
                animation: typingPulse 1.5s ease-in-out infinite;
            }

            .typing-dot:nth-child(2) { animation-delay: 0.2s; }
            .typing-dot:nth-child(3) { animation-delay: 0.4s; }

            @keyframes typingPulse {
                0%, 60%, 100% { opacity: 0.3; }
                30% { opacity: 1; }
            }

            .input-container {
                display: flex;
                padding: 15px;
                border-top: 1px solid rgba(74, 158, 255, 0.2);
                gap: 10px;
            }

            #assistant-input {
                flex: 1;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(74, 158, 255, 0.3);
                border-radius: 8px;
                padding: 8px 12px;
                color: white;
                font-size: 13px;
                outline: none;
                transition: all 0.2s;
            }

            #assistant-input:focus {
                border-color: #4a9eff;
                background: rgba(255, 255, 255, 0.15);
            }

            #assistant-input::placeholder {
                color: #888;
            }

            .send-btn {
                width: 36px;
                height: 36px;
                background: linear-gradient(45deg, #4a9eff, #357abd);
                border: none;
                border-radius: 8px;
                color: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }

            .send-btn:hover {
                transform: scale(1.05);
                box-shadow: 0 4px 12px rgba(74, 158, 255, 0.3);
            }

            .send-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
            }

            .quick-actions {
                display: flex;
                gap: 8px;
                padding: 0 15px 15px;
                flex-wrap: wrap;
            }

            .quick-btn {
                background: rgba(74, 158, 255, 0.2);
                border: 1px solid rgba(74, 158, 255, 0.3);
                border-radius: 6px;
                color: white;
                padding: 6px 10px;
                font-size: 11px;
                cursor: pointer;
                transition: all 0.2s;
                white-space: nowrap;
            }

            .quick-btn:hover {
                background: rgba(74, 158, 255, 0.3);
                transform: translateY(-1px);
            }

            .assistant-toggle {
                position: absolute;
                bottom: -60px;
                right: 0;
                width: 60px;
                height: 60px;
                background: linear-gradient(45deg, #667eea, #764ba2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                transition: all 0.3s ease;
                transform: translateY(0);
            }

            .virtual-assistant.open .assistant-toggle {
                transform: translateY(100%);
                opacity: 0;
            }

            .toggle-icon {
                font-size: 24px;
                animation: float 3s ease-in-out infinite;
            }

            @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-5px); }
            }

            .notification-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #ff4444;
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                font-weight: bold;
                animation: bounce 2s infinite;
            }

            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-5px); }
                60% { transform: translateY(-3px); }
            }

            /* Mobile responsive */
            @media (max-width: 768px) {
                .virtual-assistant {
                    width: calc(100vw - 40px);
                    right: 20px;
                    left: 20px;
                }
            }

            /* Scrollbar */
            .messages-container::-webkit-scrollbar {
                width: 4px;
            }

            .messages-container::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 2px;
            }

            .messages-container::-webkit-scrollbar-thumb {
                background: rgba(74, 158, 255, 0.5);
                border-radius: 2px;
            }
        `;
        document.head.appendChild(style);
    }

    // associate events to corresponding buttons: open/close, send, quick actions
    // and bind the input field for sending messages
    bindEvents() {
        document.getElementById('assistant-toggle').addEventListener('click', () => this.toggleAssistant(true));
        document.getElementById('close-btn').addEventListener('click', () => this.toggleAssistant(false));
        document.getElementById('minimize-btn').addEventListener('click', () => this.minimizeAssistant());

        this.inputElement = document.getElementById('assistant-input');
        const sendBtn = document.getElementById('send-btn');

        this.inputElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        sendBtn.addEventListener('click', () => this.sendMessage());

        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });

        this.messagesContainer = document.getElementById('messages-container');
    }

    // toggle to open/close the window of the VA
    toggleAssistant(open) {
        this.isOpen = open;

        if (!this.assistantElement) return;

        const toggleIcon = this.assistantElement.querySelector('.toggle-icon');
        const badge = document.getElementById('notification-badge');
        const minimizeBtn = document.getElementById('minimize-btn');

        if (open) {
            this.assistantElement.classList.add('open');
            this.assistantElement.classList.remove('minimized');

            if (badge) badge.style.display = 'none';
            if (toggleIcon) toggleIcon.textContent = '🤖';
            if (minimizeBtn) {
                minimizeBtn.innerHTML = '−';
                minimizeBtn.title = 'Minimize';
            }

            setTimeout(() => {
                this.inputElement?.focus();
            }, 300);
        } else {
            this.assistantElement.classList.remove('open');
            this.assistantElement.classList.add('minimized');

            if (toggleIcon) toggleIcon.textContent = '💬';
            if (minimizeBtn) {
                minimizeBtn.innerHTML = '↗';  
                minimizeBtn.title = 'Restore';
            }
        }

        this.updateStatus(open ? 'Online' : 'Offline');
    }

    // when panel is minimized, the button toggles between restoring the assistant or close the panel
    // and updates the status of the assistant
    minimizeAssistant() {
        const isMinimized = this.assistantElement.classList.toggle('minimized');
        const minimizeBtn = document.getElementById('minimize-btn');

        if (minimizeBtn) {
            if (isMinimized) {
                minimizeBtn.innerHTML = '↗';  
                minimizeBtn.title = 'Ripristina';
            } else {
                minimizeBtn.innerHTML = '−';
                minimizeBtn.title = 'Minimizza';
            }
        }
    }

    // updates the status of the assistant in the header
    // and changes the color of the status indicator -> green if online, gray if offline
    updateStatus(status) {
        const statusElement = document.getElementById('assistant-status');
        const indicator = document.getElementById('status-indicator');
        
        statusElement.textContent = status === 'Online' ? 'AI Interior Designer' : 'Offline';
        indicator.style.background = status === 'Online' ? '#4CAF50' : '#666';
    }

    // the user sends a message and the AI assistant answers after a delay
    // the message is added to the conversation history and displayed in the chat
    sendMessage() {
        const input = this.inputElement;
        const message = input.value.trim();
        
        if (!message) return;

        // Add user message
        this.addMessage(message, 'user');
        input.value = '';

        // Show typing indicator
        this.showTyping();

        // Simulate AI response delay
        setTimeout(() => {
            this.hideTyping();
            const response = this.generateResponse(message);
            this.addMessage(response, 'assistant');
        }, 1000 + Math.random() * 2000); // 1-3 second delay
    }

    // add a message to the chat    
    addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatar = sender === 'assistant' ? '🤖' : '👤';
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">${content}</div>
        `;

        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();

        // Store in history
        this.conversationHistory.push({ sender, content, timestamp: Date.now() });
    }

    // when reasoning about the response, the assistant shows a typing indicator
    // this to make it more realistic
    showTyping() {
        if (this.isTyping) return;
        this.isTyping = true;

        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant-message typing-message';
        typingDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="typing-indicator">
                <span>AUDREY is typing</span>
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;

        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    // hides the typing indicator after the response is generated
    hideTyping() {
        this.isTyping = false;
        const typingMessage = this.messagesContainer.querySelector('.typing-message');
        if (typingMessage) {
            typingMessage.remove();
        }
    }

    // scrolls the chat to the bottom to show the latest messages
    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 100);
    }

    // generates a response based on the user's message 
    // according to the content of the message, the assistant will provide a specific answer (in order to stay relevant)
    generateResponse(message) {
        const msg = message.toLowerCase();

        // Furniture detection
        for (const [furniture, response] of Object.entries(this.responses.furniture)) {
            if (msg.includes(furniture) || msg.includes(furniture.slice(0, -1))) {
                return response;
            }
        }

        // Lighting
        if (msg.includes('light') || msg.includes('illumination')) {
            if (msg.includes('ambient')) return this.responses.lighting.ambient;
            if (msg.includes('directional')) return this.responses.lighting.directional;
            if (msg.includes('point')) return this.responses.lighting.point;
            return "Lighting is essential! Combine ambient (overall mood), directional (spread), and point (focus) for the best effect.";
        }

        // Color themes
        if (msg.includes('color')) {
            if (msg.includes('warm')) return this.responses.colors.warm;
            if (msg.includes('cool')) return this.responses.colors.cool;
            if (msg.includes('neutral')) return this.responses.colors.neutral;
            return "Colors influence mood! Warm tones for coziness, cool for calm, and neutrals for balance. What's the feeling you're aiming for?";
        }

        // Help/Controls
        if (msg.includes('help') || msg.includes('control')) {
            return this.responses.controls;
        }

        // Analyze
        if (msg.includes('analyze') || msg.includes('evaluate') || msg.includes('how is')) {
            return this.getRandomFromArray(this.responses.analysis);
        }

        // Tips
        if (msg.includes('tip') || msg.includes('idea') || msg.includes('suggest')) {
            return this.getRandomFromArray(this.responses.tips);
        }

        const genericResponses = [
            "Interesting! Could you be more specific? Do you need help with furniture, lighting, colors, or controls?",
            "I can assist with design tips, control guidance, or analyzing your current layout. What would you like to explore?",
            "I'm here to help you perfect your room! Tell me if you'd like furniture layout help, lighting ideas, or color suggestions.",
            "I didn’t fully understand, but here’s what I can help with:<br>• Furniture layout<br>• Lighting tips<br>• Color suggestions<br>• App controls<br><br>What do you need?",
            "Try asking me things like: 'How do I place my furniture?', 'Which colors should I use?', 'How does lighting work?', or 'Analyze my room'."
        ];

        return this.getRandomFromArray(genericResponses);
    }

    // there are 3 possibile quick questions that the user can ask the assistant
    handleQuickAction(action) {
        if (this.quickActionInProgress) return;
        this.quickActionInProgress = true;

        let userMessage = '';
        let assistantResponse = '';

        switch (action) {
            case 'analyze':
                userMessage = "Analyze my room";
                break;
            case 'tips':
                userMessage = "Give me some tips";
                break;
            case 'help':
                userMessage = "How do the controls work?";
                break;
            default:
                this.quickActionInProgress = false;
                return;
        }

        // check if the last message is a duplicate of the current user message
        // if it is, do not add it to the conversation history
        const lastMsg = this.conversationHistory[this.conversationHistory.length - 1];
        const isRecentDuplicate = lastMsg && 
            lastMsg.content === userMessage && 
            lastMsg.sender === 'user' &&
            (Date.now() - lastMsg.timestamp) < 5000; // duplicates within 5 seconds

        // Add user message ONLY if it is NOT a recent duplicate
        if (!isRecentDuplicate) {
            this.addMessage(userMessage, 'user');
        }

        this.showTyping();

        // Simulate a delayed response from the assistant
        // to make it feel more realistic, as if the assistant is processing the request
        const delayedResponse = () => {
            this.hideTyping();

            switch (action) {
                case 'analyze':
                    assistantResponse = this.analyzeCurrentRoom();
                    break;
                case 'tips':
                    assistantResponse = this.getRandomFromArray(this.responses.tips);
                    break;
                case 'help':
                    assistantResponse = "Here's a complete guide:<br><br><strong>Camera Controls:</strong><br>• Drag mouse: orbit around the room<br>• Scroll wheel: zoom in/out<br>• WASD or arrow keys: manual control<br>• R: reset view<br><br><strong>Object Controls:</strong><br>• Click to select<br>• I/K: forward/backward<br>• J/L: left/right<br>• U/O: up/down<br>• Q/E: rotate Y<br>• Z/X: rotate X<br>• N/M: rotate Z<br><br><strong>Panels:</strong><br>• Left: scenes and furniture<br>• Right: lighting and materials<br>• Bottom: camera status and FPS";
                    break;
            }

            this.addMessage(assistantResponse, 'assistant');
            this.quickActionInProgress = false;
        };

        setTimeout(delayedResponse, 1000 + Math.random() * 500); // 1-1.5 second delay to simulate processing time
    }

    // analyzes the current room by checking the scene objects, lighting, and colors
    // and provides a detailed analysis with suggestions
    analyzeCurrentRoom() {
        const scene = this.app.scene;
        const objects = scene.objects.filter(obj => 
            obj.name && 
            obj.name !== 'floor' && 
            !obj.name.startsWith('wall') && 
            obj.name !== 'grid' && 
            obj.name !== 'pointLightHelper'
        );

        let analysis = "<strong>Analysis of your room:</strong><br><br>";

        // analyze the layout and furniture (mainly # of obects)
        if (objects.length === 0) {
            analysis += "<strong>Furniture:</strong> The room is empty. Start by adding essential furniture like a bed or desk!<br><br>";
        } else if (objects.length <= 3) {
            analysis += `<strong>Furniture:</strong> You have ${objects.length} items - a good start! Consider adding more accessories to complete the space.<br><br>`;
        } else if (objects.length <= 6) {
            analysis += `<strong>Furniture:</strong> You have ${objects.length} items - great balance! The space feels well-furnished.<br><br>`;
        } else {
            analysis += `<strong>Furniture:</strong> You have ${objects.length} items - be careful not to overcrowd! Less can be more.<br><br>`;
        }

        // analyze lighting
        const ambient = scene.ambientLight[0];
        const hasDirectional = scene.useDirectional;
        const hasPoint = scene.usePoint;

        analysis += "<strong>Lighting:</strong><br>";

        if (ambient < 0.2) {
            analysis += "• Too dark - increase ambient light<br>";
        } else if (ambient > 0.7) {
            analysis += "• Too bright - reduce for atmosphere<br>";
        } else {
            analysis += "• Perfect ambient level!<br>";
        }

        if (hasDirectional && hasPoint) {
            analysis += "• Excellent: you are using both directional and point light!<br>";
        } else if (!hasDirectional && !hasPoint) {
            analysis += "• Activate at least one additional light source<br>";
        }

        analysis += "<br>";

        // Analyze colors (simulate based on default values)
        analysis += "<strong>Color Palette:</strong><br>";
        analysis += "• Well-balanced neutral scheme<br>";
        analysis += "• Consider colorful accents for personality<br><br>";

        // Final suggestions
        const suggestions = [
            "<strong>Suggestion:</strong> Add plants to bring natural life",
            "<strong>Suggestion:</strong> Create a focal point with a statement piece",
            "<strong>Suggestion:</strong> Group furniture to create functional areas",
            "<strong>Suggestion:</strong> Keep pathways clear for movement",
            "<strong>Suggestion:</strong> Mix textures for visual interest"
        ];

        analysis += this.getRandomFromArray(suggestions);

        return analysis;
    }

    // returns a random response based on the category
    getRandomResponse(category) {
        const responses = this.responses[category];
        return Array.isArray(responses) ? this.getRandomFromArray(responses) : responses;
    }

    getRandomFromArray(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    // shows a notification badge when the assistant is closed
    // this is useful to alert the user that there are new messages or updates
    showNotification() {
        document.getElementById('notification-badge').style.display = 'flex';
    }

    sendSystemMessage(message) {
        if (this.isOpen) {
            this.addMessage(message, 'assistant');
        } else {
            this.showNotification();
        }
    }

    // starts proactive tips every 5 minutes if the assistant is open
    startProactiveTips() {
        setInterval(() => {
            if (this.isOpen && this.conversationHistory.length > 0) {
                const lastMessage = this.conversationHistory[this.conversationHistory.length - 1];
                const timeSinceLastMessage = Date.now() - lastMessage.timestamp;
                
                // If the last message was more than 3 minutes ago, send a proactive tip
                if (timeSinceLastMessage > 180000) {
                    const proactiveTips = [
                        "Have you ever thought about experimenting with different colors for the walls?",
                        "Try the 60-30-10 rule for colors: 60% dominant, 30% secondary, 10% accent!",
                        "Layered lighting creates depth: ambient + task + accent.",
                        "Remember: 60cm is the minimum space for comfortable walking between furniture.",
                        "Decorative objects in odd groups (3-5) create more natural compositions!"
                    ];
                    
                    this.sendSystemMessage(this.getRandomFromArray(proactiveTips));
                }
            }
        }, 300000); // Check every 5 minutes
    }
}