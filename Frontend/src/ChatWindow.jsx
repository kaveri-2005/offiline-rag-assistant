import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useEffect, useRef } from "react";
import { ScaleLoader } from "react-spinners";

function ChatWindow() {
    const { prompt, setPrompt, reply, setReply, currThreadId, setPrevChats, setNewChat, setRefreshTrigger, isSidebarOpen, setIsSidebarOpen } = useContext(MyContext);
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const fileInputRef = useRef(null);

    // --- 1. CHAT LOGIC ---
    const getReply = async () => {
        if (!prompt.trim() && !selectedFile) return;
        setLoading(true);
        setNewChat(false);

        try {
            if (selectedFile) {
                // Combined File + Prompt Upload
                const formData = new FormData();
                formData.append("file", selectedFile);
                formData.append("message", prompt);
                formData.append("threadId", currThreadId);

                const response = await fetch("http://localhost:8080/api/v1/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Server Upload Failed");
                }

                const data = await response.json();

                // Finalize UI history
                const userMessage = prompt || (selectedFile.type.startsWith("image/") ? "Analyze this image" : `Uploaded: ${selectedFile.name}`);

                if (data.isImage) {
                    setPrevChats(prev => [...prev,
                    { role: "user", content: userMessage, image: filePreview },
                    { role: "assistant", content: data.summary }
                    ]);
                } else {
                    setPrevChats(prev => [...prev,
                    { role: "user", content: userMessage },
                    { role: "assistant", content: data.reply || data.message }
                    ]);
                }

                // Clear state
                setSelectedFile(null);
                setFilePreview(null);
                setPrompt("");
                setRefreshTrigger(prev => prev + 1);

            } else {
                // Normal Text Chat
                const response = await fetch("http://localhost:8080/api/v1/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: prompt, threadId: currThreadId })
                });
                const res = await response.json();
                setReply(res.reply);
                setRefreshTrigger(prev => prev + 1);
            }
        } catch (err) {
            console.error("Error:", err);
            alert("Error: " + err.message);
        }
        setLoading(false);
    };

    // --- 2. VOICE LOGIC ---
    const startVoice = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return alert("Browser does not support Speech Recognition");

        const recognition = new SpeechRecognition();
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (e) => setPrompt(e.results[0][0].transcript);
        recognition.start();
    };

    // --- 3. FILE SELECTION ---
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSelectedFile(file);
        if (file.type.startsWith("image/")) {
            setFilePreview(URL.createObjectURL(file));
        } else {
            setFilePreview(null);
        }
        e.target.value = null; // Reset input
    };

    const removeSelectedFile = () => {
        setSelectedFile(null);
        setFilePreview(null);
    };

    const handleChipClick = (text) => {
        setPrompt(text);
        // We use a small timeout to ensure the state update for prompt is reflected
        // though in this case getReply uses the closure variable 'prompt' which might be old
        // so we'll pass it or rely on the effect. Actually, let's just trigger it directly.
        // To be safe, let's just call getReply directly after updating state if possible,
        // but React state is async. Better to pass it to a ref or just update state and 
        // let the user click send, OR pass the value to getReply.
    };

    // Effect to trigger reply if chip sets prompt and file is selected
    useEffect(() => {
        if (selectedFile && (prompt === "Summarize" || prompt === "Key Points" || prompt === "Explain")) {
            getReply();
        }
    }, [prompt, selectedFile]);


    // Update history when reply arrives
    useEffect(() => {
        if (prompt && reply) {
            setPrevChats(prev => [...prev,
            { role: "user", content: prompt },
            { role: "assistant", content: reply }
            ]);
            setPrompt("");
            setReply(""); // Reset reply to prevent duplicate triggers
        }
    }, [reply]);

    return (
        <div className="chatWindow">
            <div className="navbar">
                <div className="nav-left">
                    <button className="sidebar-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        <i className={`fa-solid ${isSidebarOpen ? 'fa-bars-staggered' : 'fa-bars'}`}></i>
                    </button>
                </div>
                <span className="nav-title">OfflineGPT</span>
                <div className="nav-right"></div>
            </div>

            <Chat />

            <div className="chatInputArea">
                {selectedFile && (
                    <div className="file-preview-area">
                        <div className="file-preview-container">
                            {filePreview ? (
                                <img src={filePreview} alt="Preview" className="image-preview-thumbnail" />
                            ) : (
                                <div className="pdf-preview-icon"><i className="fa-solid fa-file-pdf"></i> {selectedFile.name}</div>
                            )}
                            <button className="remove-file-btn" onClick={removeSelectedFile}>&times;</button>
                        </div>
                        <div className="quick-actions">
                            <button className="chip" onClick={() => handleChipClick("Summarize")}>Summarize</button>
                            <button className="chip" onClick={() => handleChipClick("Key Points")}>Key Points</button>
                            <button className="chip" onClick={() => handleChipClick("Explain")}>Explain</button>
                        </div>
                    </div>
                )}

                {loading && <div className="loader"><ScaleLoader color="#fff" height={15} /></div>}

                <div className="inputBox">
                    {/* HIDDEN FILE INPUT FOR BOTH PDF & IMAGES */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        accept=".pdf, image/*"
                        onChange={handleFileSelect}
                    />

                    {/* UPLOAD ICON */}
                    <div className="upload-btn" onClick={() => fileInputRef.current.click()}>
                        <i className="fa-solid fa-paperclip" style={{ color: selectedFile ? '#2ecc71' : 'inherit' }}></i>
                    </div>

                    {/* MAIN TEXT INPUT */}
                    <input
                        placeholder={selectedFile ? "Add instructions for this file..." : "Ask anything or use voice..."}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && getReply()}
                    />

                    {/* VOICE ICON */}
                    <div className={`voice-btn ${isListening ? "pulsing" : ""}`} onClick={startVoice}>
                        <i className="fa-solid fa-microphone" style={{ color: isListening ? 'red' : 'inherit' }}></i>
                    </div>

                    {/* SEND ICON */}
                    <div className="send-btn" onClick={getReply}>
                        <i className="fa-solid fa-paper-plane"></i>
                    </div>
                </div>
                <p className="footer-info">OfflineGPT can make mistakes. Built for B.Tech Project 2026.</p>
            </div>
        </div>
    );
}

export default ChatWindow;