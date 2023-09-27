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
    while (this.pointer < this.agenda.length) {
      const instruction = this.agenda[this.pointer];
      const toVisualiser = this.#executeInstruction(instruction);
      console.log("toVisualiser", toVisualiser);
      console.log("pointer", this.pointer);
      console.log("agenda", this.agenda);
      if (instruction.kind === "YIELD") {
        return toVisualiser;
      }
    }
  }

  #executeInstruction(instruction) {
    switch (instruction.kind) {
      case "LOAD_VAR":
        return this.#load_var(instruction.identifier);

      case "LOAD_CONST":
        return this.#load_const(instruction.value);

      case "STORE_VAR":
        return this.#store_var(instruction.identifier);

      case "BINARY_OP":
        return this.#binary_op(instruction.operator);

      case "YIELD":
        return this.#yield();

      case "JUMP_IF_FALSE":
        return this.#jump_if_false(instruction.label);

      case "JUMP":
        return this.#jump(instruction.label);

      case "LABEL":
        return this.#label();
        
      default:
        console.error(instruction.kind + " is unknown");
        break;
    }
  }

  #label() {
    this.pointer++;
  }

  #jump(label) {
    this.pointer = this.labelToIndex[label];
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
    this.pointer++;
    const value = this.stack[this.stack.length - 1].getVariable(identifier);
    this.operandStack.push(value);
  }

  #load_const(value) {
    this.pointer++;
    this.operandStack.push(value);
  }

  #store_var(identifier) {
    this.pointer++;
    const value = this.operandStack.pop();
    this.stack[this.stack.length - 1].setVariable(identifier, value);
  }

  #binary_op(operator) {
    this.pointer++;
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

      case "==":
        result = leftOperand == rightOperand;
        break;

      default:
        console.error(operator + " is an unknown operator");
        break;
    }
    this.operandStack.push(result);
  }

  #yield() {
    this.pointer++;
    this.operandStack.pop();
    return this.stack;
  }
}
