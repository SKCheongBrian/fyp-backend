import express from 'express';
const router = express.Router();

router.get('/', (req, res, next) => {
  console.log('Get request in Visual!');
  res.json({message: "It Works! (Visual)"});
});

export default router;