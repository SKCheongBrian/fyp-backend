import NodeType from "../util/ast-types.js";
import { DummyScope, ClassScope, MethodScope, Field, Variable } from "../util/scope.js";

function constructScopes(AST) {
  const dummy = new DummyScope();
  process(AST, dummy);
  return dummy.getChildren();
}

function process(node, current) {
  switch (node.node) {
    case NodeType.CompilationUnit:
      handleCompilationUnit(node.types, current);
      break;
    case NodeType.TypeDeclaration:
      handleTypeDeclaration(node, current);
      break;
    case NodeType.MethodDeclaration:
      handleMethodDeclaration(node, current);
      break;
    default:
      console.log("(Pass 3::process) This node is unknown:", node.node);
  }
}

function handleCompilationUnit(types, current) {
  const len = types.length;
  for (let i = 0; i < len; i++) {
    const type = types[i];
    const name = type.name.identifier;
    const classScope = new ClassScope(name, null);
    process(types[i], classScope);
    current.addChild(classScope);
  }
}

function addField(current, node) {
  let isStatic = false;

  const len = node.modifiers.length;
  const modifiers = node.modifiers;
  for (let i = 0; i < len; i++) {
    const modifier = modifiers[i];
    if (modifier.keyword === "static") {
      isStatic = true;
    }
  }

  const name = node.fragments[0].name.identifier;
  const field = new Field(name, isStatic);
  current.addField(field);
}

function handleTypeDeclaration(node, current) {
  const bodyDeclarations = node.bodyDeclarations;
  const len = bodyDeclarations.length;
  for (let i = 0; i < len; i++) {
    const declaration = bodyDeclarations[i];
    switch (declaration.node) {
      case NodeType.FieldDeclaration:
        addField(current, declaration);
        break;
      case NodeType.MethodDeclaration:
        const name = declaration.name.identifier;
        const methodScope = new MethodScope(name, current);
        process(declaration, methodScope);
        console.log("(pass3::handleTypeDeclaration)adding child to:", current.name, methodScope.name);
        current.addChild(methodScope);
        break;
      default:
        console.log("(pass3::handleTypeDeclaration) Unknown node:", declaration.node);
    }
  }
}

function handleMethodDeclaration(node, current) {
  const statements = node.body.statements;
  const len = statements.length;
  for (let i = 0; i < len; i++) {
    const statement = statements[i];
    switch (statement.node) {
      case NodeType.VariableDecarationStatement:
        const variableName = statement.fragments[0].name.identifier;
        const variable = new Variable(variableName);
        current.addVariable(variable);
        break;
      case NodeType.TypeDeclarationStatement:
        const declaration = statement.declaration
        const className = declaration.name.identifier;
        const classScope = new ClassScope(className, current);
        process(declaration, classScope);
        console.log("(pass3::handleMethodDeclaration)adding child to:", current.name, classScope.name);
        current.addChild(classScope);
        break;
      default:
        console.log("(pass3::handleMethodDeclaration) Unknown node:", statement.node);
    }
  }
}

export default constructScopes;
