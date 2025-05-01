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

  // console.log('PR Title:', prTitle);
  // console.log('PR Description:', prDescription);

  try {
    // Fetch list of changed files from the PR
    const filesResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`,
      githubAuthHeaders
    );
    const readmeResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/readme`,
      githubAuthHeaders
    );
    
    // Decode base64 to UTF-8 text
    const ReadmeSummary = Buffer.from(readmeResponse.data.content, 'base64').toString('utf-8');
    

    console.log('Readme Summary:', ReadmeSummary);

    // console.log('Files changed :', filesResponse.data);
    const changedFiles = filesResponse.data.map(f => ({
      filename: f.filename,
      patch: f.patch
    }));
    
    const fileSummary = changedFiles
      .map(f => `File: ${f.filename}\nPatch:\n${f.patch}`)
      .join('\n\n');
    
      const prompt = `
      You are an assistant that reviews GitHub pull requests.
      
      Based on the project details provided in the README and the code changes in the pull request, determine whether this pull request is **relevant** to the project's purpose.
      
      ### Project README:
      ${ReadmeSummary}
      
      ### Pull Request Title:
      ${prTitle}
      
      ### Pull Request Description:
      ${prDescription}
      
      ### Changed Files and Patches:
      ${fileSummary}
      
      Please analyze whether the proposed changes contribute meaningfully to the project based on the README description.
      
      Respond with only one word: **"relevant"** or **"irrelevant"**.
      `.trim();
      
    
    console.log('Prompt:', prompt);

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().toLowerCase().trim();

    // console.log('Gemini Response:', responseText);

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
