import "./Sidebar.css";
function Sidebar(){
    return (
        <section className="sidebar">
            {/*New chat  */}
            <button>
                <img src="src/assets/logo.png" alt="GPT logo"></img>
                <i className="fa-solid fa-pen-to-square"></i>
        </button>
            {/* Chat Histroy */}
            <ul className="histroy">
                <li>histroy1</li>
                <li>histroy2</li>
                <li>histroy3</li>
            </ul>
            {/* sign*/}
            <div className="Sign">
                <p>By Official RAG System</p>
            </div>
        </section>

    )
}
export default Sidebar;
