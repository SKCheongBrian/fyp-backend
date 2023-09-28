import InstrType from "./util/instruction-types.js";
import NodeType from "./util/ast-types.js";
export class Compiler {
  index = 0;
  tagCounter = 0;
  agenda = [];
  labelToIndex = {};

  compile(AST) {
    this.index = 0;
    this.tagCounter = 0;
    this.labelToIndex = {};
    this.agenda = [];
    this.operandStack = [];
    this.#translate(AST, null, null);
    return [this.agenda, this.labelToIndex];
  }

  #translate(node, end, nxt) {
    switch (node.node) {
      case NodeType.Block:
        this.#translateBlock(node.statements, end, nxt);
        break;

      case NodeType.VariableDeclarationExpression:
      case NodeType.VariableDeclarationStatement:
        this.#translateVarDecl(node, end, nxt);
        break;

      case NodeType.SimpleName:
        this.#translateIdentifier(node, end, nxt);
        break;

      case NodeType.NumberLiteral:
        this.#translateNumberLiteral(node, end, nxt);
        break;

      case NodeType.InfixExpression:
        this.#translateBinaryExpression(node, end, nxt);
        break;

      case NodeType.IfStatement:
        this.#translateIfStatement(node, end, nxt);
        break;

      case NodeType.ExpressionStatement:
        this.#translateExpressionStatement(node, end, nxt);
        break;

      case NodeType.Assignment:
        this.#translateAssignment(node, end, nxt);
        break;

      case NodeType.ForStatement:
        this.#translateForStatement(node, end, nxt);
        break;

      case NodeType.PostfixExpression:
        this.#translatePostfixExpression(node, end, nxt);
        break;

      case NodeType.PrefixExpression:
        this.#translatePrefixExpression(node, end, nxt);
        break;

      default:
        console.error("unkown type" + JSON.stringify(node));
        break;
    }
  }

  // TODO ASK PROF ABOUT THIS
  #translatePostfixExpression(node, end, nxt) {
    this.#translate(node.operand, end, nxt);
    this.agenda[this.index++] = [
      { kind: InstrType.UNARY_OP, operator: node.operator, isPrefix: false },
      end,
      nxt,
    ];
  }

  #translatePrefixExpression(node, end, nxt) {
    this.#translate(node.operand, end, nxt);
    this.agenda[this.index++] = [
      { kind: InstrType.UNARY_OP, operator: node.operator, isPrefix: true },
      end,
      nxt,
    ];
  }

  #translateForStatement(node, end, nxt) {
    const topLabel = "top" + this.#getNewTag();
    const nxtLabel = "nxt" + this.#getNewTag();
    const endLabel = "end" + this.#getNewTag();

    this.#translate(node.initializers[0], end, nxt);

    const topIndex = this.index++;
    this.labelToIndex[topLabel] = topIndex;
    this.agenda[topIndex] = [
      { kind: InstrType.LABEL, label: topLabel },
      end,
      nxt,
    ];

    this.#translate(node.expression, end, nxt);

    this.agenda[this.index++] = [
      { kind: InstrType.JIF, label: endLabel },
      end,
      nxt,
    ];

    // * update the end and nxt of the translation.
    this.#translate(node.body, endLabel, nxtLabel);

    const nxtIndex = this.index++;
    this.labelToIndex[nxtLabel] = nxtIndex;
    this.agenda[nxtIndex] = [
      { kind: InstrType.LABEL, label: nxtLabel },
      end,
      nxt,
    ];

    this.#translate(node.updaters[0], end, nxt);
    this.agenda[this.index++] = [
      { kind: InstrType.JUMP, label: topLabel },
      end,
      nxt,
    ];
    const endIndex = this.index++;
    this.labelToIndex[endLabel] = endLabel;
    this.agenda[endIndex] = [
      { kind: InstrType.LABEL, label: endLabel },
      end,
      nxt,
    ];
  }

  // TODO include += -= etc
  #translateAssignment(node, end, nxt) {
    this.#translate(node.rightHandSide, end, nxt);
    this.agenda[this.index++] = [
      { kind: InstrType.STORE_VAR, identifier: node.leftHandSide.identifier },
      end,
      nxt,
    ];
  }

  #translateExpressionStatement(node, end, nxt) {
    this.#translate(node.expression, end, nxt);
  }

  #getNewTag() {
    const tag = this.tagCounter.toString();
    this.tagCounter++;
    return tag;
  }

  #translateIfStatement(node, end, nxt) {
    const alternateLabel = "else" + this.#getNewTag();
    const endLabel = "end" + this.#getNewTag();
    this.#translate(node.expression, end, nxt);
    this.agenda[this.index++] = [
      { kind: InstrType.JIF, label: alternateLabel },
      end,
      nxt,
    ];
    this.#translate(node.thenStatement, end, nxt);
    this.agenda[this.index++] = [
      { kind: InstrType.JUMP, label: endLabel },
      end,
      nxt,
    ];
    const alternateIndex = this.index++;
    this.labelToIndex[alternateLabel] = alternateIndex;
    this.agenda[alternateIndex] = [
      { kind: InstrType.LABEL, label: alternateLabel },
      end,
      nxt,
    ];
    if (node.elseStatement !== null) {
      this.#translate(node.elseStatement, end, nxt);
    }
    const endLabelIdx = this.index++;
    this.labelToIndex[endLabel] = endLabelIdx;
    this.agenda[endLabelIdx] = [
      { kind: InstrType.LABEL, label: endLabel },
      end,
      nxt,
    ];
  }

  #translateIdentifier(node, end, nxt) {
    this.agenda[this.index++] = [
      { kind: InstrType.LOAD_VAR, identifier: node.identifier },
      end,
      nxt,
    ];
  }

  #translateNumberLiteral(node, end, nxt) {
    this.agenda[this.index++] = [
      { kind: InstrType.LOAD_CONST, value: parseInt(node.token) },
      end,
      nxt,
    ];
  }

  #translateBlock(statements, end, nxt) {
    for (let i = 0; i < statements.length; i++) {
      this.#translate(statements[i], end, nxt);
      this.agenda[this.index++] = [{ kind: InstrType.YIELD }, end, nxt];
    }
  }

  // assume that only one declaration
  #translateVarDecl(node, end, nxt) {
    const fragment = node.fragments[0];
    this.#translate(fragment.initializer, end, nxt);
    this.agenda[this.index++] = [
      { kind: InstrType.STORE_VAR, identifier: fragment.name.identifier },
      end,
      nxt,
    ];
  }

  #translateBinaryExpression(node, end, nxt) {
    this.#translate(node.rightOperand, end, nxt);
    this.#translate(node.leftOperand, end, nxt);
    this.agenda[this.index++] = [
      { kind: InstrType.BINARY_OP, operator: node.operator },
      end,
      nxt,
    ];
  }
}
