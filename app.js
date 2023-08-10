import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import interpreterRouter from './routes/interpreter-route.js';
import visualRouter from './routes/visual-route.js';
import testRouter from './routes/test-route.js';


const app = express();
app.use(express.static('client'));
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/interpreter', interpreterRouter)
app.use('/visual', visualRouter)
app.use('/test', testRouter)

app.get('/', (req, res) => {
	res.send("Hello you have successfully connected to the backend.");
});

app.listen(4000, () => {
	console.log("Backend listening on port 4000");
});
