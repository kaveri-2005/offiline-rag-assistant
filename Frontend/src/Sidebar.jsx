import "./Sidebar.css";
function Sidebar(){
    return (
        <section className="sidebar">
            {/*New chat  */}
            <button>
                <img src="src/assets/logo.png" alt="GPT logo" className="logo"></img>
                <spna><i className="fa-solid fa-pen-to-square"></i></spna>
        </button>
            {/* Chat Histroy */}
            <ul className="histroy">
                <li>Thread1</li>
                <li>Thread2</li>
                <li>Thread3</li>
            </ul>
            {/* sign*/}
            <div className="Sign">
                <p>By Offiline RAG System</p>
            </div>
        </section>

    )
}
export default Sidebar;
