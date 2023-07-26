const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser')

const interpretRouter = require('./routes/interpreter-route')
const visualRouter = require('./routes/visual-route')

const app = express();
app.use(express.static('client'));
app.use(cors())
app.use(bodyParser.urlencoded({extended: true}));
app.use('/interpreter', interpretRouter)
app.use('/visual', visualRouter)

app.get('/', (req, res) => {
    res.send("Hello you have successfully connected to the backend.");
});

app.listen(4000, () => {
    console.log("Backend listening on port 4000");
});