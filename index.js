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

    console.log('Files changed :', filesResponse.data);
    const changedFiles = filesResponse.data.map(f => ({
      filename: f.filename,
      patch: f.patch
    }));
    
    const fileSummary = changedFiles
      .map(f => `File: ${f.filename}\nPatch:\n${f.patch}`)
      .join('\n\n');
    
      const prompt = `
You are an AI reviewer for GitHub pull requests. Your job is to analyze if a pull request contributes meaningfully to the project, using the README and the code changes.

### Project README:
${ReadmeSummary}

### Pull Request Title:
${prTitle}

### Pull Request Description:
${prDescription}

### Changed Files and Patches:
${fileSummary}

Determine whether this pull request is relevant to the project's purpose based on the README content and the nature of the changes.

Important Instructions:
- If you are at least 85% confident that the pull request is irrelevant to the project, then classify it as **"irrelevant"**.
- Otherwise, classify it as **"relevant"**.
- Respond with the classification followed by your confidence percentage.

Example format:
relevant (92%)
or
irrelevant (87%)

Only output this one line. Do not explain.
`.trim();
      
    
    // console.log('Prompt:', prompt);

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().toLowerCase().trim();

    console.log('Gemini Response:', responseText);

    const [classification, confidenceWithPercent] = responseText.split(' ');
    const confidence = parseInt(confidenceWithPercent.replace(/[()%]/g, ''));
    


    if (confidence >= 85 && classification === 'relevant') {
      console.log(`Pull Request #${prNumber} is relevant.`);
      return res.status(200).send('Pull request is relevant and approved.');
    }
    
    if (confidence >= 85 && classification === 'irrelevant') {
      console.log(`Pull Request #${prNumber} is irrelevant. Closing...`);
      await axios.patch(pullRequest.url, { state: 'closed' }, githubAuthHeaders);
      return res.status(200).send('Pull request is irrelevant and has been closed.');
    }
    
    if (confidence >= 60 && confidence < 85) {
      console.log(`Pull Request #${prNumber} flagged with ${confidence}% confidence.`);
    
      await axios.post(
        `${pullRequest.comments_url}`,
        {
          body: `⚠️ This pull request has been flagged for manual review.\n\n**Reason**: AI confidence is ${confidence}%, which is not high enough to auto-close or approve.\n\n**Classification**: ${classification}`,
        },
        githubAuthHeaders
      );
    
      return res.status(200).send('Pull request flagged for manual review.');
    }
    
  } catch (err) {
    console.error('Error processing PR:', err.response?.data || err.message);
    return res.status(500).send('Error analyzing pull request.');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


