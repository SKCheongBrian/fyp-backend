import { uniqueId } from "lodash";

function createGlobalEnvironment() {
  return {
    name: 'global',
    tail: null,
    bindings: {},
    id: -1,
  };
}

const interpreter = (function () {
  let environment = createGlobalEnvironment();

  // keeps track of instructions that still need to be evaluated
  let agenda;
  // stack to keep temporary variables (different from runtime stack)
  let executionStack;

  /**
   * Loads an ast generated by the pegjs parser for java resets the agenda and
   * execution stack
   * @param {*} ast the ast to be loaded into the interpreter
   */
  function loadAst(ast) {
    agenda = [];
    agenda.push(ast);
    executionStack = [];
  }

  function createBlockEnvironment() {
    return {
      name: 'block',
      tail: environment,
      bindings: {},
      id: uniqueId(),
    };
  }


  function executeStep(node) {
    switch (node.node) {
      case "block":
        const newEnv = createBlockEnvironment();
        environment = newEnv;
        break;

      default:
        throw new Error("unknown node type");
    }
  }
})();

export default interpreter;
