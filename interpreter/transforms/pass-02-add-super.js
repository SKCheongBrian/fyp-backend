import NodeType from "../util/ast-types.js";
import SuperBuilder from "../util/super-builder.js";

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
    case NodeType.MethodDeclaration:
      handleMethodDeclaration(AST);
      return AST;
    default:
      console.log("(Pass2::process) This node is unknown:", AST.node);
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
  // guard incase the type is an interface instead of a class.
  if (node.interface) {
    return;
  }
  const len = node.bodyDeclarations.length;
  const bodyDecl = node.bodyDeclarations;

  for (let i = 0; i < len; i++) {
    const declaration = bodyDecl[i];
    if (declaration.node == NodeType.MethodDeclaration) {
      if (isSuperMissing(declaration)) {
        insertSuper(declaration);
      } else {
        process(declaration);
      }
    }
  }
}

function handleMethodDeclaration(node) {
  const statements = node.body.statements; 
  const len = statements.length;
  for (let i = 0; i < len; i++) {
    const statement = statements[i];
    if (statement.node == NodeType.TypeDeclarationStatement) {
      process(statement.declaration);
    }
  }
}

function isSuperMissing(node) { // TODO check that super first one or there are no supers at all.
  // super is not first one throw exception
  return node.constructor &&
      ((node.body.statements.length > 0 &&
      node.body.statements[0].node != NodeType.SuperConstructorInvocation) ||
      node.body.statements.length == 0)
}

function insertSuper(node) {
  const superStatement = SuperBuilder.build();
  node.body.statements.unshift(superStatement);
}


export default addSuper;
