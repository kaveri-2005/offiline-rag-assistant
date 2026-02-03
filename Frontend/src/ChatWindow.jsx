import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import {MyContext} from './MyContext.jsx';
import {useContext , useState} from 'react';
import {ScaleLoader} from 'react-spinners';

function ChatWindow() {
  const {prompt,setPrompt,reply,setReply,currThreadId}=useContext(MyContext);
  const {loading ,setLoading}=useState(false);
  const getReply=async()=>{
    setLoading(true);
    console.log("message", prompt,"threadId",currThreadId);
    const options={
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        message:prompt,
        threadId:currThreadId
      })
 
    } ;
    try{
       const response=await fetch("http://localhost:8000/api/v1/getReply",options);
       const res=await response.json();
       console.log(res);
       setReply(res.reply);
    }
    catch(err){
      console.log(err);
    }
    setLoading(false);
    
  }
  return (
    <div className="chatWindow ">
      <div className="navbar">
        <span>
          OfflineGPT <i className="fa-solid fa-angle-down"></i>
        </span>
        <div className="userIconDiv">
          <span className="userIcon">
            <i className="fa-regular fa-circle-user"></i>
          </span>
        </div>
      </div>
      <Chat></Chat>
       <ScaleLoader color="#36d7b7" loading={loading} size={150} />
      <div className="chatInput">
        <div className="userInput">
          <input placeholder="Ask anything"
          value={prompt}
          onChange={(e)=> setPrompt(e.target.value)} 
          onKeyDown={(e)=>e.key==="Enter" ?getRelpy():''}
          >
          </input>
          <div id="submit" onClick={getReply}></div>
        </div>

        <p className="info">
          OffilineGPT can make mistakes. Check important info . see Cookie
          Preferences.
        </p>
      </div>
    </div>
  );
}
export default ChatWindow;
