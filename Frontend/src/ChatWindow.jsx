import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useEffect, useRef } from "react";
import { ScaleLoader } from "react-spinners";

function ChatWindow() {
    const { prompt, setPrompt, reply, setReply, currThreadId, setPrevChats, setNewChat } = useContext(MyContext);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const fileInputRef = useRef(null);

    // --- 1. CHAT LOGIC ---
    const getReply = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setNewChat(false);

        try {
            const response = await fetch("http://localhost:8080/api/v1/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: prompt, threadId: currThreadId })
            });
            const res = await response.json();
            setReply(res.reply);
        } catch (err) {
            console.error("Backend Error:", err);
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

    // --- 3. UNIFIED FILE UPLOAD (PDF & IMAGE) ---
  
    const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const isImg = file.type.startsWith("image/");
    const localImgUrl = isImg ? URL.createObjectURL(file) : null;
    
    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch("http://localhost:8080/api/v1/upload", {
            method: "POST",
            body: formData,
        });

        // ADD THIS: If the server crashes, this will alert you!
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Server Upload Failed");
        }

        const data = await response.json();

        if (data.isImage) {
            setPrevChats(prev => [...prev, 
                { role: "user", content: "Analyze this image", image: localImgUrl },
                { role: "assistant", content: data.summary }
            ]);
        } else {
            //  FIX: Update UI for PDF success so you know it worked
            setPrevChats(prev => [...prev, 
                { role: "user", content: `Uploaded: ${file.name}` },
                { role: "assistant", content: "I have analyzed the document. You can now ask questions about it!" }
            ]);
        }
    } catch (err) { 
        console.error("Upload Error:", err);
        alert("Upload Failed: " + err.message); // Now you will see errors!
    } finally {
        setLoading(false);
        e.target.value = null; // Reset input so you can upload the same file again
    }
};
            
              

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
                <span className="nav-logo">OfflineGPT <i className="fa-solid fa-chevron-down"></i></span>
                <div className="userIcon" onClick={() => setIsOpen(!isOpen)}>
                    <i className="fa-solid fa-user"></i>
                </div>
            </div>

            {isOpen && (
                <div className="dropDown">
                    <div className="dropDownItem"><i className="fa-solid fa-gear"></i> Settings</div>
                    <div className="dropDownItem" onClick={() => {localStorage.clear(); window.location.reload();}}>
                        <i className="fa-solid fa-arrow-right-from-bracket"></i> Log out
                    </div>
                </div>
            )}

            <Chat />

            <div className="chatInputArea">
                {loading && <div className="loader"><ScaleLoader color="#fff" height={15} /></div>}
                
                <div className="inputBox">
                    {/* HIDDEN FILE INPUT FOR BOTH PDF & IMAGES */}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        style={{display: "none"}} 
                        accept=".pdf, image/*" 
                        onChange={handleFileUpload}
                    />

                    {/* UPLOAD ICON */}
                    <div className="upload-btn" onClick={() => fileInputRef.current.click()}>
                        <i className="fa-solid fa-paperclip"></i>
                    </div>

                    {/* MAIN TEXT INPUT */}
                    <input 
                        placeholder="Ask anything or use voice..." 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && getReply()}
                    />

                    {/* VOICE ICON */}
                    <div className={`voice-btn ${isListening ? "pulsing" : ""}`} onClick={startVoice}>
                        <i className="fa-solid fa-microphone" style={{color: isListening ? 'red' : 'inherit'}}></i>
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