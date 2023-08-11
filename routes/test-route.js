import express from 'express';
import pass1 from '../interpreter/transforms/pass-01-addConstructor.js';
import pass2 from '../interpreter/transforms/pass-02-addSuper.js';
const router = express.Router();

router.post("/", (req, res) => {
  const ast = req.body;

  const astWithConstructors = pass1(ast);
  const superAST = pass2(ast);

  res.send(superAST);
});

export default router;
