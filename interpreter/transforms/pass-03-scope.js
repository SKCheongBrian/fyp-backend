import NodeType from "../util/ast-types.js";
import { DummyScope, ClassScope, MethodScope, Field, Variable } from "../util/scope.js";

let dummy;
let classScopes = {};
function constructScopes(AST) {
  let new_mark = true;
  while (new_mark) {
    dummy = new DummyScope();
    console.log("Starting an iteration of while loop");
    new_mark = false;
    new_mark = process(AST, dummy);
    console.log("new_mark:", new_mark);
  }
  return dummy.getChildren();
}

function process(node, current) {
  switch (node.node) {
    case NodeType.CompilationUnit:
      return handleCompilationUnit(node, current);
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

function getClassScope(name, isStatic) {
  if (classScopes.hasOwnProperty(name)) {
    return classScopes[name];
  } else {
    const classScope = new ClassScope(name, null, isStatic);
    classScopes[name] = classScope;
    return classScope;
  }
}

function handleCompilationUnit(node, current) {
  const curr_mark = !(node.hasOwnProperty("mark"));
  console.log("(handleCompilationUnit) curr_mark:", curr_mark);
  if (curr_mark) {
    node["mark"] = true;
  } else {
    console.log("(handleCompilationUnit) already marked:", node);
  }
  const types = node.types;
  const len = types.length;
  let new_mark = false;
  for (let i = 0; i < len; i++) {
    const type = types[i];
    const name = type.name.identifier;
    let isStatic = false;

    const len = type.modifiers.length;
    const modifiers = type.modifiers;
    for (let i = 0; i < len; i++) {
      const modifier = modifiers[i];
      if (modifier.keyword === "static") {
        isStatic = true;
      }
    }

    const classScope = getClassScope(name, isStatic);
    const process_mark = process(types[i], classScope);
    if (process_mark || curr_mark) {
      new_mark = true;
    }
    current.addChild(classScope);
  }
  return new_mark;
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

function hasSuper(node) {
  return node.superclassType !== null;
}

function getSuperScope(node, curr) {
  const superName = node.superclassType.name.identifier;

  if (classScopes.hasOwnProperty(superName)) {
    return classScopes[superName];
  }
  return null;
}

function handleTypeDeclaration(node, current) {
  // guard incase node is an interface instead of a class
  if (node.interface) {
    return;
  }
  if (hasSuper(node)) {
    const superScope = getSuperScope(node, dummy);
    if (superScope) {
      current.addSuperScope(superScope);
    } else {
      return false;
    }
  }

  let new_mark = false;
  const bodyDeclarations = node.bodyDeclarations;
  const curr_mark = !(node.hasOwnProperty("mark"));
  if (curr_mark) {
    node["mark"] = true;
    new_mark = true;
  } else {
    console.log("(handleTypeDeclaration) already marked:", node);
  }
  const len = bodyDeclarations.length;
  for (let i = 0; i < len; i++) {
    const declaration = bodyDeclarations[i];
    switch (declaration.node) {
      case NodeType.FieldDeclaration:
        if (!node.hasOwnProperty("doneChildren")) {
          addField(current, declaration);
          // current.addChild(methodScope);
        }
        break;
      case NodeType.MethodDeclaration:
        const name = declaration.name.identifier;
        let isStatic = false;

        const len = declaration.modifiers.length;
        const modifiers = declaration.modifiers;
        for (let i = 0; i < len; i++) {
          const modifier = modifiers[i];
          if (modifier.keyword === "static") {
            isStatic = true;
          }
        }
        
        const methodScope = new MethodScope(name, current, isStatic);
        const process_mark = process(declaration, methodScope);
        if (process_mark) {
          new_mark = true;
        }
        console.log("(pass3::handleTypeDeclaration)adding child to:", current.name, methodScope.name);
        if (!node.hasOwnProperty("doneChildren")) {
          current.addChild(methodScope);
        }
        break;
      default:
        console.log("(pass3::handleTypeDeclaration) Unknown node:", declaration.node);
    }
  }
  node["doneChildren"] = true;
  return new_mark;
}

function handleMethodDeclaration(node, current) {
  let new_mark = false;
  const curr_mark = !(node.hasOwnProperty("mark"));
  if (curr_mark) {
    new_mark = true;
    node["mark"] = true;
  } else {
    console.log("(handleMethodDeclaration) already marked:", node);
  }

  // add parameters into the current scope if any.
  const parameterList = node.parameters;
  const parameterListLength = parameterList.length;
  if (parameterListLength > 0) {
    for (let i = 0; i < parameterListLength; i++) {
      const parameter = parameterList[i];
      const parameterName = parameter.name.identifier;
      current.addVariable(new Variable(parameterName));
    }
  }

  const statements = node.body.statements;
  const len = statements.length;
  // go through statements and add variables, if there is a type
  // declaration, create a new scope for that type
  for (let i = 0; i < len; i++) {
    const statement = statements[i];
    switch (statement.node) {
      case NodeType.VariableDecarationStatement:
        const variableName = statement.fragments[0].name.identifier;
        current.addVariable(new Variable(variableName));
        break;
      case NodeType.TypeDeclarationStatement:
        const declaration = statement.declaration
        const className = declaration.name.identifier;
        let isStatic = false;

        const len = declaration.modifiers.length;
        const modifiers = declaration.modifiers;
        for (let i = 0; i < len; i++) {
          const modifier = modifiers[i];
          if (modifier.keyword === "static") {
            isStatic = true;
          }
        }
        const classScope = new ClassScope(className, current, isStatic);
        const process_mark = process(declaration, classScope);
        if (process_mark) {
          new_mark = true;
        }
        console.log("(pass3::handleMethodDeclaration)adding child to:", current.name, classScope.name);
        current.addChild(classScope);
        break;
      default:
        console.log("(pass3::handleMethodDeclaration) Unknown node:", statement.node);
    }
  }
  return new_mark;
}

export default constructScopes;
