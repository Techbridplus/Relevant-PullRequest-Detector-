
import axios from 'axios';
import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv'
dotenv.config()
import cors from 'cors'
import OpenAIApi from 'openai';

const openai = new OpenAIApi({ apiKey: process.env.OPENAI_API_KEY });
// Middleware to authenticate with GitHub
const githubAuthHeaders = {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    },
  };
const app = express();
app.use(cors());

// Middleware to parse JSON from GitHub's webhook
app.use(bodyParser.json());

// Webhook route for handling pull request events
// Route to analyze and process incoming pull requests
app.post('/webhook', async (req, res) => {
    const pullRequest = req.body.pull_request;
    const prTitle = pullRequest.title;
    const prDescription = pullRequest.body;
  
    try {
      // Analyze pull request relevance with OpenAI
      const completion = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt: `Determine if this pull request is relevant:\nTitle: ${prTitle}\nDescription: ${prDescription}\n\nRespond with "relevant" or "irrelevant".`,
        max_tokens: 500,
      });
  
      const responseText = completion.data.choices[0].text.trim().toLowerCase();
  
      if (responseText === 'relevant') {
        console.log(`Pull Request #${pullRequest.number} is relevant.`);
        res.status(200).send('Pull request is relevant and approved.');
      } else {
        console.log(`Pull Request #${pullRequest.number} is irrelevant.`);
  
        // Close the pull request if it’s irrelevant
        await axios.patch(
          pullRequest.url,
          { state: 'closed' },
          githubAuthHeaders
        );
  
        res.status(200).send('Pull request is irrelevant and has been closed.');
      }
    } catch (error) {
      console.error('Error processing pull request:', error);
      res.status(500).send('Error analyzing pull request');
    }
  });
  
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });