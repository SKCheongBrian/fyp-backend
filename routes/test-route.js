import express from 'express';
import pass1 from '../interpreter/transforms/pass-01-add-constructor.js';
import pass2 from '../interpreter/transforms/pass-02-add-super.js';
import pass3 from '../interpreter/transforms/pass-03-scope.js';
import pass4 from '../interpreter/transforms/pass-04-variable-capture.js';
import { stringify } from 'flatted';

const router = express.Router();

router.post("/", (req, res) => {
  const ast = req.body;

  const astWithConstructors = pass1(ast);
  const superAST = pass2(astWithConstructors);
  const scopes = pass3(superAST);
  const finalAST = pass4(superAST, scopes);

  res.send({
    AST: superAST,
    finalAST: finalAST,
    scopes: stringify(scopes),
  });
});

export default router;
