import express from 'express';
import process from '../interpreter/transforms/pass-01-addConstructor.js';
const router = express.Router();

router.post("/", (req, res) => {
  const ast = req.body;

  const astWithConstructors = process(ast);

  res.send(astWithConstructors);
});

export default router;