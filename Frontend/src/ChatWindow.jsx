import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useEffect } from "react";
import { ScaleLoader } from "react-spinners";

function ChatWindow() {
    const { prompt, setPrompt, reply, setReply, currThreadId, setPrevChats, setNewChat } = useContext(MyContext);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

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

    useEffect(() => {
        if (prompt && reply) {
            setPrevChats(prev => [...prev, 
                { role: "user", content: prompt },
                { role: "assistant", content: reply }
            ]);
            setPrompt("");
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
                    <div className="dropDownItem"><i className="fa-solid fa-arrow-right-from-bracket"></i> Log out</div>
                </div>
            )}

            <Chat />

            <div className="chatInputArea">
                {loading && <div className="loader"><ScaleLoader color="#fff" size={15} /></div>}
                <div className="inputBox">
                    <input 
                        placeholder="Ask anything..." 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && getReply()}
                    />
                    <div className="send-btn" onClick={getReply}>
                        <i className="fa-solid fa-paper-plane"></i>
                    </div>
                </div>
                <p className="footer-info">OfflineGPT can make mistakes. Check important info.</p>
            </div>
        </div>
    );
}

export default ChatWindow;