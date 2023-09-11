import NodeType from "../util/ast-types.js";

let scopes;
let currentScope;

function addVariableCapture(ast, passed_in) {
  scopes = passed_in;
  process(ast);
  return ast;
}

/**
 * Processes the node recursively to check for variable captures
 * and add to needed constructors.
 * 
 * Assumes that currentScope is set properly.
 * currentScope should be set correctly by the previous
 * handle function.
 * @param {Node} node the node that is being processed
 */
function process(node) {
  switch (node.node) {
    case NodeType.CompilationUnit:
      handleCompilationUnit(node);
      break;
    case NodeType.TypeDeclaration:
      hanldeTypeDeclaration(node)
      break;
  }
}

function handleCompilationUnit(compilationUnit) {
  const types = compilationUnit.types;
  const len = types.length();
  for (let i = 0; i < len; i++) {
    const type = types[i];
    const typeName = type.name.identifier;
    currentScope = scopes[typeName];
    process(type);
  }
}

export default addVariableCapture;
