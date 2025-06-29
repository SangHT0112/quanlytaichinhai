import OpenAI from 'openai';
import { type } from 'os';
const openai = new OpenAI();

// const response = await openai.chat.completions.create({
//     model: "gpt-3.5-turbo",
//     message: [
//         {
//             role: "user",
//             content: "Hello, how are you?",
//         },
//     ],
// });

// console.log(response.choices[0].message.content);

const responseImg = await openai.completions.create({
    model: "gpt-4o-mini",
    messages: [
        {
            role: "user",
            content: [
                {type: "text", text: "What's is in image?"},
                {
                    type: "image_url",
                    image_url: {
                        url: "https://images.unsplash.com/photo-1686746107712-0b1c3f8d6e4f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
                    }
                }
            ]
        }
 
    ]
})


const resAPI = await openai.chat.completions.create({
    model: "gpt-40-mini",
    messages:[
        {
            role:"system",
            content: "Bạn là trợ lý ảo AI",
        },
        {
            role: "user",
            content:" Hãy giúp tôi viết 1 đoạn code để lấy dữ liệu API",
        },
    ]
})

const resAPI2 = await openai.chat.completions.create({
    model: "gpt-40-mini",
    messages:[
        {role:"system", content: "Ban la tro ly ao AI giup toi viet code nha"},
        {role:"user", content:"Giup to viet 1 doan code de lay du lieu API tu openAI"}
    ]
})

const resAPI3 = await openai.chat.complestions.create({
    model: "gpt-4o-mini",
    messages: [
        {role: "system", content: "Bạn là trợ lý ảo AI nhé"},
        {
            role:"user",
            content:" giúp tôi viết code đê"
        }
    ]
})