import NodeType from "../util/ast-types.js";
import ConstructorBuilder from "../util/constructor-builder.js";

function addConstructors(AST) {
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
      console.log("(Pass1::process) This node is unknown:", AST.node);
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

  let hasConstructor = false;

  for (let i = 0; i < len; i++) {
    const declaration = bodyDecl[i];
    if (declaration.node == NodeType.MethodDeclaration) {
      // check if node is a constructor or normal method
      if (declaration.constructor) {
        hasConstructor = true;
      } else {
        // recurse on function to find more types
        process(declaration);
      }
    }
  }

  if (!hasConstructor) {
    insertConstructor(node);
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

function insertConstructor(node) {
  const nameString = extractNameString(node);
  const builder = new ConstructorBuilder(nameString);

  node.bodyDeclarations.push(builder.buildConstructor());
}

function extractNameString(node) {
  return node.name.identifier;
}

export default addConstructors;
