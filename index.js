import axios from 'axios';
import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.YOUR_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(bodyParser.json());

const githubAuthHeaders = {
  headers: {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
  },
};

app.post('/webhook', async (req, res) => {
  const event = req.body;

  if (!event.pull_request) {
    return res.status(200).send('Not a pull request event.');
  }

  const pullRequest = event.pull_request;
  const prTitle = pullRequest.title;
  const prDescription = pullRequest.body;
  const prNumber = pullRequest.number;
  const repo = event.repository.name;
  const owner = event.repository.owner.login;

  console.log('PR Title:', prTitle);
  console.log('PR Description:', prDescription);

  try {
    // Fetch list of changed files from the PR
    const filesResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`,
      githubAuthHeaders
    );
    console.log('Files changed :', filesResponse.data);
    const changedFiles = filesResponse.data.map(f => ({
      filename: f.filename,
      patch: f.patch
    }));
    
    const fileSummary = changedFiles
      .map(f => `File: ${f.filename}\nPatch:\n${f.patch}`)
      .join('\n\n');
    
    const prompt = `
    Check if the following pull request is relevant or irrelevant to this project.
    Our project is a chat application built using Next.js.
    
    Title: ${prTitle}
    Description: ${prDescription}
    Changes Summary (filename,patch): ${fileSummary}
    Only reply with "relevant" or "irrelevant".
    `.trim();
    

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().toLowerCase().trim();

    console.log('Gemini Response:', responseText);

    if (responseText === 'relevant') {
      console.log(`Pull Request #${prNumber} is relevant.`);
      return res.status(200).send('Pull request is relevant and approved.');
    } else {
      console.log(`Pull Request #${prNumber} is irrelevant. Closing...`);

      await axios.patch(
        pullRequest.url,
        { state: 'closed' },
        githubAuthHeaders
      );

      return res.status(200).send('Pull request is irrelevant and has been closed.');
    }
  } catch (err) {
    console.error('Error processing PR:', err.response?.data || err.message);
    return res.status(500).send('Error analyzing pull request.');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

for(int i=0;i<10;i++){
 printf("hello");
}
