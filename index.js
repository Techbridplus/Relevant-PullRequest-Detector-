
import axios from 'axios';
import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv'
dotenv.config()
import cors from 'cors'
import {GoogleGenerativeAI}  from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.YOUR_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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

    console.log('Extracted pull request:', pullRequest);
    console.log('Pull request title:', prTitle);
    console.log('Pull request description:', prDescription);
  
    try {
      // Analyze pull request relevance with OpenAI
      const prompt = "Check if the pull request is relevant or irrelevant.our project is about making a nextjs project in we are making chat application and we want only that pull request which help on our project,respose only relevent or irrelavant Pull request title: " + prTitle + ". Pull request description: " + prDescription;

      const result = await model.generateContent(prompt);
      console.log(result.response.text());

      const responseText = result.response.text().toLowerCase();
      console.log('Response from Gemeni:', responseText);
  
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
    console.log('Pull request processed.');
  });
  
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
  });