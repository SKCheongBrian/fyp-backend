const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const userInput = req.query.data;
  // Process the userInput as needed
  console.log(userInput);

  // Send a response back to the client
  res.send('User input received');
});

module.exports = router;