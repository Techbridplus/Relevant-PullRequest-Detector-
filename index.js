import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import webhookRoute from './routes/webhook.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.use('/webhook', webhookRoute);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
