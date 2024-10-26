

import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv'
dotenv.config()
import cors from 'cors'
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors())
// Parse application/json payload
app.use(bodyParser.json());

// GitHub Webhook endpoint
app.post('/webhook', (req, res) => {  
    console.log('Webhook received:', req.body);  
    res.status(200).send('Webhook received');  
});  

app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
});
