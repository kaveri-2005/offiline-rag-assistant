import "./Sidebar.css";
import { useContext, useEffect } from "react";
import { MyContext } from "./MyContext.jsx";
import { v1 as uuidv1 } from "uuid";
import logo from "./assets/logo.png";

function Sidebar() {
    const { allThreads, setAllThreads, currThreadId, setNewChat, setPrompt, setReply, setCurrThreadId, setPrevChats, refreshTrigger, isSidebarOpen } = useContext(MyContext);

    const getAllThreads = async () => {
        try {
            const response = await fetch("http://localhost:8080/api/v1/thread");
            const res = await response.json();
            const filteredData = res.map((thread) => ({
                threadId: thread.threadId,
                title: thread.title,
            }));
            setAllThreads(filteredData);
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        getAllThreads();
    }, [currThreadId, refreshTrigger])

    const createNewChat = () => {
        setNewChat(true);
        setPrompt("");
        setReply(null);
        setCurrThreadId(uuidv1());
        setPrevChats([]);
    }
    const loadExistingChat = async (id) => {
        const response = await fetch(`http://localhost:8080/api/v1/thread/${id}`);
        const data = await response.json();
        setPrevChats(data.messages); // THIS LINE redirects the history to the screen
        setNewChat(false);
    };
    const changeThread = async (newThreadId) => {
        setCurrThreadId(newThreadId);
        try {
            const response = await fetch(`http://localhost:8080/api/v1/thread/${newThreadId}`);
            const res = await response.json();

            // This is the key: replace old messages with the new ones from the database
            setPrevChats(res.messages || []);
            setNewChat(false);
            setReply(null); // Stop any previous typing animation
        } catch (err) {
            console.log("Error switching chat:", err);
        }
    }


    const deleteThread = async (threadId) => {
        try {
            // 1. Tell the backend to delete it
            const response = await fetch(`http://localhost:8080/api/v1/thread/${threadId}`, {
                method: "DELETE"
            });

            if (response.ok) {
                // 2. ONLY update the UI if the backend confirms success
                setAllThreads(prev => prev.filter(thread => thread.threadId !== threadId));

                // 3. If you deleted the chat you are currently looking at, start a new one
                if (threadId === currThreadId) {
                    createNewChat();
                }
            }
        } catch (err) {
            console.log("Delete failed:", err);
        }
    }

    return (
        <div className={`sidebar ${isSidebarOpen ? '' : 'hidden'}`}>
            <div className="sidebar-header">
                <button className="new-chat-btn" onClick={createNewChat}>
                    <div className="btn-left">
                        <img src={logo} alt="logo" className="logo" />
                        <span>New Chat</span>
                    </div>
                    <i className="fa-solid fa-pen-to-square pencil-icon"></i>
                </button>
            </div>

            <ul className="history">
                {allThreads?.map((thread, idx) => (
                    <li key={idx}
                        onClick={() => changeThread(thread.threadId)}
                        className={thread.threadId === currThreadId ? "highlighted" : " "}
                    >
                        <i className="fa-regular fa-message icon-left"></i>
                        <span className="thread-title">{thread.title}</span>
                        <i className="fa-solid fa-trash trash-icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteThread(thread.threadId);
                            }}
                        ></i>
                    </li>
                ))}
            </ul>

            <div className="sign">
                <p>By Offline RAG &hearts;</p>
            </div>
        </div>
    )
}

export default Sidebar;