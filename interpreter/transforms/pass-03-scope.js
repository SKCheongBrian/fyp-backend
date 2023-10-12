import NodeType from "../util/ast-types.js";
import {
  DummyScope,
  ClassScope,
  MethodScope,
  Field,
  Variable,
} from "../util/scope.js";

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
  return dummy;
}

/**
 * Validates that the given name is a valid Java name.
 * @param {*} name A string that is the name to be validated.
 * @returns  True if the name is valid. Otherwise, return false.
 */
function isValidJavaVariableName(name) {
  // Regular expression to validate Java variable names
  var regex = /^[a-zA-Z_$][a-zA-Z\d_$]*$/;
  if (!regex.test(name)) {
    throw Error("The name:" + name + " is not valid.")
  }
}

function process(node, current) {
  switch (node.node) {
    case NodeType.CompilationUnit:
      return handleCompilationUnit(node, current);
    case NodeType.TypeDeclaration:
      return handleTypeDeclaration(node, current);
    case NodeType.MethodDeclaration:
      return handleMethodDeclaration(node, current);
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
  const curr_mark = !node.hasOwnProperty("mark");
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
    isValidJavaVariableName(name);
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
  isValidJavaVariableName(name);
  const field = new Field(name, isStatic);
  current.addField(field);
}

function hasSuper(node) {
  return node.superclassType !== null;
}

function getSuperScope(node) {
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
    const superScope = getSuperScope(node);
    if (superScope) {
      current.addSuperScope(superScope);
    } else {
      return false;
    }
  }

  let new_mark = false;
  const bodyDeclarations = node.bodyDeclarations;
  const curr_mark = !node.hasOwnProperty("mark");
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
        }
        break;
      case NodeType.MethodDeclaration: {
        const name = declaration.name.identifier;
        isValidJavaVariableName(name);
        let isStatic = false;
        let visibility;

        const len = declaration.modifiers.length;
        const modifiers = declaration.modifiers;
        for (let i = 0; i < len; i++) {
          const modifier = modifiers[i];
          if (modifier.keyword === "static") {
            isStatic = true;
          } else if (modifier.keyword === "private") {
            visibility = "private";
          } else if (modifier.keyword === "public") {
            visibility = "public";
          } else if (modifier.keyword === "protected") {
            visibility = "protected";
          }
        }

        function getType(type) {
          // constructors don't have a return type but are methods.
          if (type === null) {
            return "*CONSTRUCTOR*"; 
          }

          if (type.node === "SimpleType") {
            return type.name.identifier;
          } else if (type.node === "PrimitiveType") {
            return type.primitiveTypeCode;
          }
        }

        const returnType = getType(declaration.returnType2);

        const paramTypes = [];
        for (let i = 0; i < declaration.parameters.length; i++) {
          const param = declaration.parameters[i];
          const type = getType(param.type);
          paramTypes.push(type);
        }

        const methodScope = new MethodScope(
          name,
          current,
          isStatic,
          returnType,
          paramTypes,
          visibility
        );
        const process_mark = process(declaration, methodScope);
        if (process_mark) {
          new_mark = true;
        }
        console.log(
          "(pass3::handleTypeDeclaration)adding child to:",
          current.name,
          methodScope.name
        );
        if (!node.hasOwnProperty("doneChildren")) {
          current.addChild(methodScope);
        }
        break;
      }
      case NodeType.TypeDeclaration: {
        const name = declaration.name.identifier;
        isValidJavaVariableName(name);
        let isStatic = false;

        const len = declaration.modifiers.length;
        const modifiers = declaration.modifiers;
        for (let i = 0; i < len; i++) {
          const modifier = modifiers[i];
          if (modifier.keyword === "static") {
            isStatic = true;
          }
        }
        const classScope = getClassScope(name, isStatic);
        const process_mark = process(declaration, classScope);
        if (process_mark) {
          new_mark = true;
        }
        console.log(
          "(pass3::handleTypeDeclaration)adding child to:",
          current.name,
          classScope.name
        );
        if (!node.hasOwnProperty("doneChildren")) {
          current.addChild(classScope);
        }
        break;
      }
      default:
        console.log(
          "(pass3::handleTypeDeclaration) Unknown node:",
          declaration.node
        );
    }
  }
  node["doneChildren"] = true;
  return new_mark;
}

function handleMethodDeclaration(node, current) {
  let new_mark = false;
  const curr_mark = !node.hasOwnProperty("mark");
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
      isValidJavaVariableName(parameterName);
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
      case NodeType.VariableDeclarationStatement:
        const variableName = statement.fragments[0].name.identifier;
        isValidJavaVariableName(variableName);
        current.addVariable(new Variable(variableName));
        break;
      case NodeType.TypeDeclarationStatement:
        const declaration = statement.declaration;
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
        console.log(
          "(pass3::handleMethodDeclaration)adding child to:",
          current.name,
          classScope.name
        );
        current.addChild(classScope);
        break;
      default:
        console.log(
          "(pass3::handleMethodDeclaration) Unknown node:",
          statement.node
        );
    }
  }
  return new_mark;
}

export default constructScopes;
