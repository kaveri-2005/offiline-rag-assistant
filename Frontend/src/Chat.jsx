import "./Chat.css";
import React, { useContext, useState, useEffect } from "react";
import { MyContext } from "./MyContext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

function Chat() {
    const { newChat, prevChats, reply } = useContext(MyContext);
    const [latestReply, setLatestReply] = useState(null);

    useEffect(() => {
        if (reply === null) {
            setLatestReply(null);
            return;
        }

        if (!prevChats?.length) return;

        const content = reply.split(" "); // Split by words for natural typing
        let idx = 0;
        const interval = setInterval(() => {
            setLatestReply(content.slice(0, idx + 1).join(" "));
            idx++;
            if (idx >= content.length) clearInterval(interval);
        }, 40);

        return () => clearInterval(interval);
    }, [reply]); // Trigger effect when a new reply arrives

    const handleCopy = (text, e) => {
        navigator.clipboard.writeText(text);
        const icon = e.currentTarget.querySelector('i');
        const originalClass = icon.className;
        icon.className = "fa-solid fa-check"; // Show checkmark
        setTimeout(() => {
            icon.className = originalClass; // Restore original icon
        }, 2000);
    };

    return (
        <div className="chats">
            {newChat && <h1 className="welcome-text">Start a New Chat!</h1>}

            {prevChats?.map((chat, idx) => (
                <div className={chat.role === "user" ? "userDiv" : "gptDiv"} key={idx}>
                    {chat.role === "user" ? (
                        <div className="userMessageContainer">
                            {chat.image && <img src={chat.image} alt="User Upload" className="chat-image-preview" />}
                            <p className="userMessage">{chat.content}</p>
                        </div>
                    ) : (
                        <div className="gptMessage">
                            <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                                {chat.content}
                            </ReactMarkdown>
                            <button className="copy-btn" onClick={(e) => handleCopy(chat.content, e)} title="Copy to clipboard">
                                <i className="fa-solid fa-copy"></i>
                            </button>
                        </div>
                    )}
                </div>
            ))}

            {/* Typing Animation Section */}
            {latestReply !== null && (
                <div className="gptDiv">
                    <div className="gptMessage">
                        <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                            {latestReply}
                        </ReactMarkdown>
                        <button className="copy-btn" onClick={(e) => handleCopy(latestReply, e)} title="Copy to clipboard">
                            <i className="fa-solid fa-copy"></i>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Chat;