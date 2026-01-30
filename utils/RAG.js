import ollama from "ollama";
export const getRAGResponse=async(message)=>{
        try{
        const response=await ollama.chat({
            model:"llama3",
            messages:[{role:"user", content:message}],
        });
        return response.message.content;
     } catch(err){
           console.log(err);
        }

};