// const express = require('express')
import express from 'express'
// require('dotenv').config()
import dotenv from 'dotenv'
dotenv.config()
import cors from 'cors'
const app = express()
const port = process.env.port||3000
app.use(cors())
app.get('/', (req, res) => {
  res.send('Hello World! i am the word')
})
app.get('/api/jokes', (req, res) => {
  const jokes = [
    {
      id: 1,
      question: 'What is the best thing about Switzerland?',
      answer: 'I do not know'
    },
    {
      id: 2,
      question: 'What is the best thing about Switzerland?',
      answer: 'I do not know'
    },
    {
      id: 3,
      question: 'What is the best thing about Switzerland?',
      answer: 'I do not know'
    },
    {
      id: 4,
      question: 'What is the best thing about Switzerland?',
      answer: 'I do not know'
    },
    {
      id: 5,
      question: 'What is the best thing about Switzerland?',
      answer: 'I do not know'
    }
  ]
  res.send(jokes)
})

app.listen(port, () => {
  console.log(`serve at http://localhost:${port}`)
})