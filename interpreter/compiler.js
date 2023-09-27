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
    this.#translate(AST);
    return [this.agenda, this.labelToIndex];
  }

  #translate(node) {
    switch (node.node) {
      case "Block":
        this.#translateBlock(node.statements);
        break;
      case "VariableDeclarationStatement":
        this.#translateVarDecl(node);
        break;
      case "SimpleName":
        this.#translateIdentifier(node);
        break;
      case "NumberLiteral":
        this.#translateNumberLiteral(node);
        break;
      case "InfixExpression":
        this.#translateBinaryExpression(node);
        break;
      case "IfStatement":
        this.#translateIfStatement(node);
      case "ExpressionStatement":
        this.#translateExpressionStatement(node);
      default:
        console.error("unkown type" + JSON.stringify(node));
        break;
    }
  }

  #translateExpressionStatement(node) {

  }

  #getNewTag() {
    const tag = this.tagCounter.toString();
    this.tagCounter++;
    return tag;
  }

  #translateIfStatement(node) {
    const alternateLabel = "else" + this.#getNewTag();
    const endLabel = "end" + this.#getNewTag();
    this.#translate(node.expression);
    this.agenda[this.index++] = { kind: "JUMP_IF_FALSE", label: alternateLabel };
    this.#translate(node.thenStatement);
    this.agenda[this.index++] = { kind: "JUMP", label: endLabel };
    const alternateIndex = this.index++;
    this.labelToIndex[alternateLabel] = alternateIndex;
    this.agenda[alternateIndex] = { kind: "LABEL", label: alternateLabel };
    if (node.elseStatement !== null) {
      this.#translate(node.elseStatement);
    }
    const endLabelIdx = this.index++;
    this.labelToIndex[endLabel] = endLabelIdx;
    this.agenda[endLabelIdx] = { kind: "LABEL", label: endLabel };
  }

  #translateIdentifier(node) {
    this.agenda[this.index++] = { kind: "LOAD_VAR", identifier: node.identifier }
  }

  #translateNumberLiteral(node) {
    this.agenda[this.index++] = { kind: "LOAD_CONST", value: parseInt(node.token) }
  }

  #translateBlock(statements) {
    for (let i = 0; i < statements.length; i++) {
      this.#translate(statements[i]);
      this.agenda[this.index++] = { kind: "YIELD" };
    }
  }

  // assume that only one declaration
  #translateVarDecl(node) {
    const fragment = node.fragments[0];
    this.#translate(fragment.initializer);
    this.agenda[this.index++] = { kind: "STORE_VAR", identifier: fragment.name.identifier }
  }

  #translateBinaryExpression(node) {
    this.#translate(node.rightOperand);
    this.#translate(node.leftOperand);
    this.agenda[this.index++] = { kind: "BINARY_OP", operator: node.operator }
  }
}

