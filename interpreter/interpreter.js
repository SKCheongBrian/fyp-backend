import StackFrame from "./stack/stack-frame.js";
import InstrType from "./util/instruction-types.js";

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
      try {
        const instruction = this.agenda[this.pointer][0];
        const end = this.agenda[this.pointer][1];
        const nxt = this.agenda[this.pointer][2];
        const toVisualiser = this.#executeInstruction(instruction, end, nxt);
        console.log("toVisualiser", toVisualiser);
        console.log("pointer", this.pointer);
        console.log("agenda", this.agenda);
        if (instruction.kind === "YIELD") {
          return toVisualiser;
        }
      } catch (e) {
        // console.log(e.message);
        this.reset();
        return { Error: e.message };
      }
    }
  }

  #executeInstruction(instruction, end, nxt) {
    switch (instruction.kind) {
      case InstrType.LOAD_VAR:
        return this.#load_var(instruction.identifier);

      case InstrType.LOAD_CONST:
        return this.#load_const(instruction.value);

      case InstrType.STORE_VAR:
        return this.#store_var(instruction.identifier);

      case InstrType.BINARY_OP:
        return this.#binary_op(instruction.operator);

      case InstrType.YIELD:
        return this.#yield();

      case InstrType.JIF:
        return this.#jump_if_false(instruction.label);

      case InstrType.JUMP:
        return this.#jump(instruction.label);

      case InstrType.LABEL:
        return this.#label();

      case InstrType.UNARY_OP:
        return this.#unary_op();
        
      default:
        console.error(instruction.kind + " is unknown");
        break;
    }
  }

  #unary_op() {
    
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
