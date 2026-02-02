import './App.css';
import Sidebar from './Sidebar.jsx';
import ChatWindow from './ChatWindow.jsx';
import Chat from './Chat.jsx';
import { MyContext } from './MyContext.jsx';
function App() {
  const providerValues={};
  return (
    <div className='main'>
      <MyContext.Provider values={providerValues}>

      <Sidebar></Sidebar>
       <ChatWindow></ChatWindow> 
       <Chat></Chat>
      </MyContext.Provider> 
    </div>
  )
}

export default App;
