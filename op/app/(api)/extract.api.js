import axios from "axios";

const GenerateContent = async (isTodo, text) => {


    try {
        console.log(isTodo , text)
        const response = await axios.post("http://192.168.29.175:3000/extract/Ai-generate",
            { isTodo, text },
            { headers: { 'Content-Type': 'application/json' } }
        );

        if (response.status !== 200) {
            throw new Error('Network response was not ok');
        }

        console.log(response.data);

    } catch (error) {
        console.error('Error generating content:', error);
        return null; // Return null or handle the error as needed
    }
}

const GetContent = async(isTodo) => {
    try {
        const response = await axios.get(`http://192.168.29.175:3000/${isTodo ? "todo" : "notes"}/${isTodo ? 'gettodo' : 'getnote'}`);

        if (response.status !== 200) {
            throw new Error('Network response was not ok');
        }

        return response.data;

    } catch (error) {
        console.error('Error getting content:', error);
        return null;
    }
}

export { GenerateContent  , GetContent}

export default GenerateContent;