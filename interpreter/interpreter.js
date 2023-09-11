import StackFrame from "./stack/stack-frame.js";

export class Interpreter {
  agenda;
  labelToIndex;
  operandStack;
  pointer;
  stack;

  constructor() {
    this.agenda = [];
    this.labelToIndex = {};
    this.operandStack = [];
    this.pointer = 0;
    this.stack = [new StackFrame("main")];
  }

  init(agenda, labelToIndex) {
    this.agenda = agenda;
    this.labelToIndex = labelToIndex;
  }



  reset() {
    this.pointer = 0;
    this.operandStack = [];
    this.stack = [new StackFrame("main")];
  }

  evalStep() {
    debugger;
    while (this.pointer < this.agenda.length) {
      const instruction = this.agenda[this.pointer];
      const toVisualiser = this.#executeInstruction(instruction);
      console.log("toVisualiser", toVisualiser);
      if (instruction.kind === "YIELD") {
        return toVisualiser;
      }
    }
  }

  #executeInstruction(instruction) {
    switch (instruction.kind) {
      case "LOAD_VAR":
        this.pointer++;
        return this.#load_var(instruction.identifier);
      case "LOAD_CONST":
        this.pointer++;
        return this.#load_const(instruction.value);
      case "STORE_VAR":
        this.pointer++;
        return this.#store_var(instruction.identifier);
      case "BINARY_OP":
        this.pointer++;
        return this.#binary_op(instruction.operator);
      case "YIELD":
        this.pointer++;
        return this.#yield();
      case "JUMP_IF_FALSE":
        return this.#jump_if_false(instruction.label);
      default:
        console.error(instruction.kind + " is unknown");
        break;
    }
  }

  #jump_if_false(label) {
    const pred = this.operandStack.pop();
    if (pred) {
      this.pointer++;
    } else {
      this.pointer = this.labelToIndex[label];
    }
  }

  #load_var(identifier) {
    const value = this.stack[this.stack.length - 1].getVariable(identifier);
    this.operandStack.push(value);
  }

  #load_const(value) {
    this.operandStack.push(value);
  }

  #store_var(identifier) {
    const value = this.operandStack.pop();
    this.stack[this.stack.length - 1].setVariable(identifier, value);
  }

  #binary_op(operator) {
    const leftOperand = this.operandStack.pop();
    const rightOperand = this.operandStack.pop();
    let result;

    switch (operator) {
      case "+":
        result = leftOperand + rightOperand;
        break;

      case "-":
        result = leftOperand - rightOperand;
        break;

      case "*":
        result = leftOperand * rightOperand;
        break;

      case "/":
        result = leftOperand / rightOperand;
        break;

      case "%":
        result = leftOperand % rightOperand;
        break;

      case ">":
        result = leftOperand > rightOperand;
        break;

      case ">=":
        result = leftOperand >= rightOperand;
        break;

      case "<":
        result = leftOperand < rightOperand;
        break;

      case "<=":
        result = leftOperand <= rightOperand;
        break;

      default:
        console.error(operator + " is an unknown operator");
        break;
    }
    this.operandStack.push(result);
  }

  #yield() {
    this.operandStack.pop();
    return this.stack;
  }
}
