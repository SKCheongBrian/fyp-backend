export class Compiler {
  index = 0;
  agenda = [];

  compile(AST) {
    this.index = 0;
    this.agenda = [];
    this.operandStack = [];
    this.#translate(AST);
    return this.agenda;
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
      default:
        console.error("unkown type" + JSON.stringify(node));
        break;
    }
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
    // TODO think about this part again. (whether we want the yield at the end)
    // this.#translate(statements[statements.length - 1]);
  }

  // assume that only one declaration
  #translateVarDecl(node) {
    const fragment = node.fragments[0];
    // TODO do a check for this.
    this.#translate(fragment.initializer);
    // ! This maybe wrong... need to check with prof.
    // this.agenda[this.index++] = { kind: "DECL_VAR", identifier: fragment.name.identifier }
    this.agenda[this.index++] = { kind: "STORE_VAR", identifier: fragment.name.identifier }
  }

  #translateBinaryExpression(node) {
    this.#translate(node.rightOperand);
    this.#translate(node.leftOperand);
    this.agenda[this.index++] = { kind: "BINARY_OP", operator: node.operator}
  }
}

