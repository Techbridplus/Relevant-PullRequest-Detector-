# 🔍 Auto PR Filter – Intelligent Pull Request Validator

This project automatically filters out **irrelevant or low-effort pull requests** using AI. If a pull request doesn't contribute meaningfully to the repository, it gets **automatically closed** with an appropriate comment.

---

## 🚀 Features

- 🧠 **Project Understanding**: Automatically detects what the GitHub repository is about by analyzing key files (`README.md`, `package.json`, `index.js`, etc.).
- 📄 **PR Summarization**: Understands what files were changed and how they affect the project.
- ❌ **Automatic Filtering**: Closes pull requests that don't provide meaningful contributions (e.g., just spacing or meaningless text edits).
- 🔗 **GitHub Webhook Integration**: Works directly via GitHub Webhooks.

---

## 🛠️ Tech Stack

- **Node.js**  
- **Express.js**  
- **GitHub Webhooks**  
- **OpenAI (GPT model)**

---

## ⚙️ How It Works

1. A pull request is created on your GitHub repository.
2. GitHub sends a webhook payload to your backend.
3. Your backend:
   - Fetches important files to understand the repo.
   - Analyzes the changes in the pull request.
   - Summarizes the intent of the PR using OpenAI.
4. If the PR is deemed **irrelevant or non-contributory**, it is **automatically closed** with a comment.

---

## 📦 How to Use

1. **Deploy your backend** to any server (e.g., Render, Railway, Vercel with API routes).
2. Copy your backend endpoint URL.
3. Go to your GitHub repo:
   - Settings → Webhooks → Add webhook
   - Set the Payload URL to your backend endpoint
   - Content type: `application/json`
   - Choose "Let me select individual events" → Check `Pull requests`
   - Click **Add Webhook**

That’s it! The system will now analyze all new pull requests.

---

## 🧪 Example

> PR #14 changed only the indentation in `index.js` without improving functionality.  
✅ System automatically closed the PR with the message:  
_“Thank you for your contribution, but this change does not add any meaningful value to the project.”_

---

## 📝 License

MIT License. Use freely with proper credit.

---

## 🤖 Built with 💡 + 🛠 by [Techbridplus]
