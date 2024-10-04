

import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv'
dotenv.config()
import cors from 'cors'
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors())
// Parse application/json payload
app.use(bodyParser.json());

// GitHub Webhook endpoint
app.post('/webhook', (req, res) => {
    const event = req.headers['x-github-event'];
    const signature = req.headers['x-hub-signature'];

    // Verify the payload with your GitHub secret (optional, for security)
    // You can validate the request using HMAC if needed
    
    // Parse the payload from GitHub
    const payload = req.body;

    console.log(`Received event: ${event}`);
    console.log(`Payload:`, payload);

    // Handle the event (for example, if it's a pull request)
    if (event === 'pull_request') {
        const action = payload.action;
        const prTitle = payload.pull_request.title;
        const prBody = payload.pull_request.body;

        console.log(`Pull Request Action: ${action}`);
        console.log(`Title: ${prTitle}`);
        console.log(`Description: ${prBody}`);

        // Perform your logic (e.g., send data to OpenAI API)
        const { Configuration, OpenAIApi } = require("openai");

        const configuration = new Configuration({
          apiKey: process.env.OPENAI_API_KEY,
        });
        const openai = new OpenAIApi(configuration);

        const response = async()=>{
          return await openai.createCompletion({
          model: "text-davinci-003",
          prompt: "Analyze this code and tell me if it is relevant to a React project: " + codeChanges,
          max_tokens: 500,
        });}
    }
      console.log(response)
    // Respond to GitHub
    res.status(200).send('Webhook received');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
});
