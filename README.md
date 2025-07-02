# GitHub Pull Request Validator Webhook

This project is a GitHub webhook built with Node.js and Express that automatically validates incoming pull requests (PRs). If a PR totally not related to your project (e.g., wrong code,made pullrequest only for fun, title format, etc.), the webhook will **automatically close the PR** and optionally leave a comment explaining why.

## 🚀 Features

- 🔍 Validates PR title, target branch, body content, or any custom rule
- ❌ Automatically closes invalid PRs
- 💬 Adds comments on invalid pull requests for feedback
- 📦 Easy to configure and extend with your own rules

## 🧰 Tech Stack

- **Node.js + Express**
- **GitHub Webhooks**
- **Axios** (for GitHub API requests)
- **Dotenv** (environment config)
- **JavaScript (ES6)**

## 📂 Project Structure

