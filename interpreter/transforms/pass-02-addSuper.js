import NodeType from "../util/ast-types.js";

function addSuper(AST) {
  return process(AST);
}

function process(AST) {
  switch (AST.node) {
    case NodeType.CompilationUnit:
      handleCompilationUnit(AST.types);
      return AST;
    case NodeType.TypeDeclaration:
      handleType(AST);
      return AST;
    default:
      console.log("This node is unkown", AST.node);
      return AST;
  }
}

function handleCompilationUnit(types) {
  const len = types.length;
  for (let i = 0; i < len; i++) {
    process(types[i]);
  }
}

function handleType(node) {
  const len = node.bodyDeclarations.length;
  const bodyDecl = node.bodyDeclarations;

  for (let i = 0; i < len; i++) {
    const declaration = bodyDecl[i];
    if (isSuperMissing(declaration)) {
      insertSuper(declaration);
    }
  }
}

function isSuperMissing(node) {
  return node.node == NodeType.MethodDeclaration &&
      node.constructor &&
      node.body.statements.length > 0 &&
      node.body.statements[0].node != NodeType.SuperConstructorInvocation
}


export default addSuper;
