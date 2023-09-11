import express from "express";
import { Compiler } from "../interpreter/compiler.js";
import { Interpreter } from "../interpreter/interpreter.js";
import generate_pass1 from "../interpreter/transforms/pass-01-generate-simple-AST.js";

const router = express.Router();
const compiler = new Compiler();
const interpreter = new Interpreter();
let agenda;
let labelToIndex;

router.post("/", (req, res) => {
  const ast = req.body;

  const simpleAST = generate_pass1(ast);

  console.log("simpleAST:", simpleAST);
  [agenda, labelToIndex] = compiler.compile(simpleAST);
  interpreter.init(agenda, labelToIndex);
  console.log("agenda:", agenda);
  console.log("labelToIndex:", labelToIndex);

  res.send("agenda populated");
});

router.get("/step", (req, res) => {

  const env = interpreter.evalStep();
  // console.log(env);
  res.send(env);
});

router.get("/reset", (req, res) => {
  interpreter.reset();
  agenda = [];

  res.send("interpreter resetted.");
});

export default router;
