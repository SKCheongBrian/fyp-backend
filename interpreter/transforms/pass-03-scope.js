import NodeType from "../util/ast-types.js";

function constructScopes(AST) {
  let classes = []
  process(AST, classes);
  return classes;
}

function process(AST, classes) {
  switch (AST.node) {
    case NodeType.CompilationUnit:
      handleCompilationUnit(AST.types, classes);
      break;
    case NodeType.TypeDeclaration:
      handleType(AST, classes);
      break;
    case NodeType.MethodDeclaration:
      handleMethodDeclaration(AST, classes);
      break;
    default:
      console.log("(Pass 3::process) This node is unknown:", AST.node);
  }
}

function handleComplationUnit(types, classes) {

}
