import express from 'express';
import pass1 from '../interpreter/transforms/pass-01-addConstructor.js';
import pass2 from '../interpreter/transforms/pass-02-addSuper.js';
import pass3 from '../interpreter/transforms/pass-03-scope.js';
import { stringify } from 'flatted';

const router = express.Router();

router.post("/", (req, res) => {
  const ast = req.body;

  const astWithConstructors = pass1(ast);
  const superAST = pass2(astWithConstructors);
  const scopes = pass3(superAST);

  res.send({
    AST: superAST,
    scopes: stringify(scopes),
  });
});

export default router;
