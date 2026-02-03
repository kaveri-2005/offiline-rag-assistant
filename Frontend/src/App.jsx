import './App.css';
import Sidebar from './Sidebar.jsx';
import ChatWindow from './ChatWindow.jsx';
import Chat from './Chat.jsx';
import { MyContext } from './MyContext.jsx';
import {useState} from 'react';
import {v1 as uuidv1} from 'uuid';

function App() {
  const[prompt,setPrompt]=useState("");
  const[reply,setReply]=useState(null);
  const[currThreadId, setcurrThreadId]=useState(uuidv1());
  const providerValues={
    prompt, setPrompt,
    reply, setReply,
    currThreadId, setcurrThreadId
  };


  return (
    <div className='main'>
      <MyContext.Provider value={providerValues}>

      <Sidebar></Sidebar>
       <ChatWindow></ChatWindow> 
       <Chat></Chat>
      </MyContext.Provider> 
    </div>
  )
}

export default App;
