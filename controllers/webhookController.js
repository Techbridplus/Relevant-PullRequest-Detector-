import axios from 'axios';
import crypto from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.YOUR_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const githubAuthHeaders = {
  headers: {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
  },
};

export const handleWebhook = async (req, res) => {
  const event = req.body;

  if (!event.pull_request) {
    return res.status(200).send('Not a pull request event.');
  }

//   const signature = req.headers['x-hub-signature-256'];
//   const expectedSignature = crypto
//     .createHmac('sha256', process.env.GITHUB_SECRET)
//     .update(JSON.stringify(event))
//     .digest('hex');

//   const bufferSig = Buffer.from(signature || '', 'utf8');
//   const bufferExpected = Buffer.from(`sha256=${expectedSignature}`, 'utf8');
//   if (
//     bufferSig.length !== bufferExpected.length ||
//     !crypto.timingSafeEqual(bufferSig, bufferExpected)
//   ) {
//     return res.status(403).send('Invalid signature.');
  }

  const pullRequest = event.pull_request;
  const { title: prTitle, body: prDescription, number: prNumber, url, comments_url } = pullRequest;
  const repo = event.repository.name;
  const owner = event.repository.owner.login;

  try {
    const [filesResponse, readmeResponse] = await Promise.all([
      axios.get(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`, githubAuthHeaders),
      axios.get(`https://api.github.com/repos/${owner}/${repo}/readme`, githubAuthHeaders),
    ]);

    const ReadmeSummary = Buffer.from(readmeResponse.data.content, 'base64').toString('utf-8');
    const changedFiles = filesResponse.data.map(f => ({
      filename: f.filename,
      patch: f.patch,
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
- Respond with the classification followed by your confidence percentage.

Example format:
relevant (92%)
or
irrelevant (87%)

Only output this one line. Do not explain.
`.trim();

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().toLowerCase().trim();
    console.log('Gemini Response:', responseText);

    const match = responseText.match(/(relevant|irrelevant)\s*\(?(\d+)%\)?/i);
    if (!match) {
      throw new Error("Could not parse Gemini response");
    }

    const classification = match[1].toLowerCase();
    const confidence = parseInt(match[2]);
    console.log('Classification:', classification);
    console.log('Confidence:', confidence);

    if (classification === 'irrelevant' && confidence >= 85) {
      console.log(`Pull Request #${prNumber} is irrelevant. Closing...`);
      await axios.patch(url, { state: 'closed' }, githubAuthHeaders);
      return res.status(200).send('Pull request is irrelevant and has been closed.');
    }

    if (classification === 'relevant' && confidence >= 85) {
      console.log(`Pull Request #${prNumber} is relevant.`);
      return res.status(200).send('Pull request is relevant and approved.');
    }

    console.log(`Pull Request #${prNumber} flagged with ${confidence}% confidence.`);

    await axios.post(
      comments_url,
      {
        body: `⚠️ This pull request has been flagged for manual review.\n\n**Reason**: AI confidence is ${confidence}%, which is not high enough to auto-close or approve.\n\n**Classification**: ${classification}`,
      },
      githubAuthHeaders
    );

    await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/labels`,
      { labels: ['needs-review'] },
      githubAuthHeaders
    );

    return res.status(200).send('Pull request flagged for manual review.');
  } catch (err) {
    console.error('Error processing PR:', err.response?.data || err.message);
    return res.status(500).send('Error analyzing pull request.');
  }
};
