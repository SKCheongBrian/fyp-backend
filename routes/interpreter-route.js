import express from "express";
import { Compiler } from "../interpreter/compiler.js";
import { Interpreter } from "../interpreter/interpreter.js";
import generate_pass1 from "../interpreter/transforms/pass_01_generateSimpleAST.js";

const router = express.Router();
const compiler = new Compiler();
const interpreter = new Interpreter();
let agenda;

router.post("/", (req, res) => {
  const ast = req.body;

  const simpleAST = generate_pass1(ast);

  console.log(simpleAST);
  agenda = compiler.compile(simpleAST);
  interpreter.setAgenda(agenda);
  console.log(agenda);

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
