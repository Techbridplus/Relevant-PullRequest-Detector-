

import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv'
dotenv.config()
import cors from 'cors'


const app = express();
app.use(cors())
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON from GitHub's webhook
app.use(bodyParser.json());

// Webhook route for handling pull request events
app.post("/", (req, res) => {
    const event = req.headers["x-github-event"];
    
    if (event === "pull_request") {
        const pullRequestData = req.body;
        console.log("Pull Request Data:", pullRequestData);
        console.log("Action:", pullRequestData.action);
        console.log("Title:", pullRequestData.pull_request.title);
        console.log("Sender:", pullRequestData.sender.login);
        console.log("Repository:", pullRequestData.repository.full_name);
    }
    console.log("hello world");
    res.status(200).send("Received the webhook!");
});

app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
});
