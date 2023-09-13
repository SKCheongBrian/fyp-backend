import NodeType from "../util/ast-types.js";

let scopes;
let currentScope;
// stack to help go up parents of ast
let stack;

function addVariableCapture(ast, passedIn) {
  scopes = passedIn;
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
      handleTypeDeclaration(node);
      break;
    case NodeType.MethodDeclaration:
      handleMethodDeclaration(node);
      break;
    case NodeType.VariableDecarationStatement:
      handleVariableDeclaration(node);
      break;
    case NodeType.InfixExpression:
      handleInfix(node);
      break;
    case NodeType.SimpleName:
      handleSimpleName(node);
      break;
    case NodeType.ExpressionStatement:
      handleExpression(node);
      break;
    case NodeType.ReturnStatement:
      handleReturn(node);
      break;
  }
}

/**
 * Iterates through the type declarations in the program and processes them.
 * @param {CompilationUnit} compilationUnit the node that corresponds to the compilation unit
 * of the Java program.
 */
function handleCompilationUnit(compilationUnit) {
  const types = compilationUnit.types;
  const len = types.length;
  for (let i = 0; i < len; i++) {
    const type = types[i];
    const typeName = type.name.identifier;
    currentScope = scopes[typeName];
    stack = [];
    process(type);
  }
}

/**
 * Iterates through the methods of the type declaration (children) and calls process on them.
 * Fields are ignored since only variable reads are considered.
 * @param {TypeDeclaration} typeDeclaration the node that corresponds to the type declaration.
 */
function handleTypeDeclaration(typeDeclaration) {
  // short circuit since interfaces are not considered.
  if (typeDeclaration.interface) {
    return;
  }
  const bodyDeclarations = typeDeclaration.bodyDeclarations;
  const len = bodyDeclarations.length;
  for (let i = 0; i < len; i++) {
    const bodyDeclaration = bodyDeclarations[i];
    // only process normal methods, constructors do not need to be processed.
    if (
      bodyDeclaration.node == NodeType.MethodDeclaration &&
      !bodyDeclaration.constructor
    ) {
      const methodName = bodyDeclaration.name.identifier;
      stack.push(typeDeclaration);
      const restoreScope = currentScope;
      currentScope = currentScope.getChildren()[methodName];
      process(bodyDeclaration);
      currentScope = restoreScope;
      stack.pop();
    }
  }
}

function handleMethodDeclaration(methodDeclaration) {
  const statements = methodDeclaration.body.statements;
  const len = statements.length;

  for (let i = 0; i < len; i++) {
    // need to look for more type declarations to process
    // or statements that read variables.
    const statement = statements[i];
    if (statement.node == NodeType.TypeDeclarationStatement) {
      const declaration = statement.declaration;
      const typeName = declaration.name.identifier;
      stack.push(methodDeclaration);
      const restoreScope = currentScope;
      currentScope = currentScope.getChildren()[typeName];
      process(declaration);
      currentScope = restoreScope;
      stack.pop();
    } else {
      stack.push(methodDeclaration);
      process(statement);
      stack.pop();
    }
  }
}

function handleVariableDeclaration(declaration) {
  const fragment = declaration.fragments[0];
  process(fragment.initializer);
}

function handleInfix(infix) {
  process(infix.leftOperand);
  process(infix.rightOperand);
}

function handleSimpleName(simpleName) {
  captureVariable(simpleName.identifier);
}

function captureVariable(name) {
  const recoverStack = [];
  let cursor = currentScope;
  let node = stack.pop();
  let found = false;
  while (!found) {
    if (cursor.isClassScope()) {
      if (cursor.fields.hasOwnProperty(name)) {
        found = true;
      } else {
        cursor = cursor.parent;
        recoverStack.push(node);
        node = stack.pop();
      }
    } else {
      if (cursor.variables.hasOwnProperty(name)) {
        found = true;
      } else {
        cursor = cursor.parent;
        recoverStack.push(node);
        node = stack.pop();
      }
    }
  }

  // node should be where the variable is declared.
  if (node.node == NodeType.MethodDeclaration) {
    // should do variable capture
    const declaration = findDeclaration(name, node);
    makeDeclarationFinal(declaration);
    // capture variable in each class TODO check about the variable recapture 
    while (recoverStack.length != 0) {
      const nextNode = recoverStack.pop();
      stack.push(nextNode);
      if (nextNode.node == NodeType.TypeDeclaration) {
        addCaptureToConstructor(name, nextNode);
      }
    }
  }
  while (recoverStack.length != 0) {
    stack.push(recoverStack.pop());
  }
}

function addCaptureToConstructor(name, typeDeclaration) {
  const bodyDeclarations = typeDeclaration.bodyDeclarations;
  const capture = {
    node: "Capture",
    name: {
      identifier: name,
      node: "SimpleName"
    }
  }
  const len = bodyDeclarations.length;
  for (let i = 0; i < len; i++) {
    const declaration = bodyDeclarations[i];
    if (declaration.node == NodeType.MethodDeclaration && declaration.constructor) {
      declaration.body.statements.push(capture);
    }
  }
}

function findDeclaration(name, node) {
  const statements = node.body.statements;
  const len = statements.length;

  for (let i = 0; i < len; i++) {
    const statement = statements[i];
    if (
      statement.node == NodeType.VariableDecarationStatement &&
      statement.fragments[0].name.identifier == name
    ) {
      return statement;
    }
  }
  console.log("ERROR WE COULDN'T FIND IT BOYS");
}

function makeDeclarationFinal(declaration) {
  const finalModifier = {
    node: "Modifier",
    keyword: "final",
  }
  let is_final = false;
  const modifiers = declaration.modifiers;
  for (let i = 0; i < modifiers.length; i++) {
    const modifier = modifiers[i];
    if (modifier.keyword == "final") {
      is_final = true;
    }
  }

  if (!is_final) {
    modifiers.push(finalModifier);
  }
}

function handleExpression(expressionStatement) {
  const expr = expressionStatement.expression;
  process(expr.rightHandSide);
}

function handleReturn(returnStatement) {
  const expr = returnStatement.expression;
  process(expr);
}

export default addVariableCapture;
