import NodeType from "../util/ast-types.js";

let currentScope;

function addMissingMethods(AST, scopes) {
  currentScope = scopes;
  process(AST, scopes);
}

function process(AST, scope) {
  switch (AST.node) {
    case NodeType.CompilationUnit:
      handleCompilationUnit(AST, scope);
      break;

    case NodeType.TypeDeclaration:
      handleTypeDeclaration(AST, scope);
      break;

    case NodeType.MethodDeclaration:
      handleMethodDeclaration(AST, scope);
      break;

    case NodeType.TypeDeclarationStatement:
      process(AST.declaration, scope);

    default:
      break;
  }
}

function handleCompilationUnit(compilationUnit, scope) {
  const types = compilationUnit.types;
  const len = types.length;
  for (let i = 0; i < len; i++) {
    const type = types[i];
    process(type, scope);
  }
}

function isSameMethod(name, returnType, paramTypes, key, value) {
  if (key != name) {
    return false;
  }
  if (value.returnType != returnType) {
    return false;
  }
  if (value.paramTypes.length != paramTypes.length) {
    return false;
  } else {
    for (let i = 0; i < paramTypes.length; i++) {
      if (value.paramTypes[i] != paramTypes[i]) {
        return false;
      }
    }
  }
  return true;
}

function hasMethod(name, returnType, paramTypes, methodScope) {
  for (const [key, value] of Object.entries(methodScope.children)) {
    if (isSameMethod(name, returnType, paramTypes, key, value)) return true;
  }
  return false;
}

function createSpecialSuperCall(name, returnType, paramTypes, visibility) {
  return {
    node: "SpecialSuperCall",
    name: {
      node: "SimpleName",
      identifier: name,
    },
    paramTypes: paramTypes,
    modifiers: [
      {
        node: "Modifier",
        keyword: visibility,
      },
    ],
    returnType: returnType,
  };
}

function addSpecialSuperCalls(typeDeclaration, scope) {
  // go to the super class scope
  let superScope = scope.superClass;

  // iterate through the methods of class and recursively look for
  // super classes  and add super calls if implementation missing
  while (superScope !== null && superScope !== undefined) {
    for (const [name, prop] of Object.entries(superScope.children)) {
      if (
        !prop.isClassScope() &&
        prop.visibility !== "private" &&
        prop.returnType !== "*CONSTRUCTOR*"
      ) {
        const isMethodMissing = !hasMethod(
          name,
          prop.returnType,
          prop.paramTypes,
          scope
        );

        if (isMethodMissing) {
          typeDeclaration.bodyDeclarations.push(
            createSpecialSuperCall(
              name,
              prop.returnType,
              prop.paramTypes,
              prop.visibility
            )
          );
        }
      }
    }
    superScope = superScope.superClass;
  }
}

function handleTypeDeclaration(typeDeclaration, scope) {
  const className = typeDeclaration.name.identifier;
  scope = scope.children[className];
  addSpecialSuperCalls(typeDeclaration, scope);
  // recurse process on methods to search for nested classes
  
  const bodyDecl = typeDeclaration.bodyDeclarations;
  const len = bodyDecl.length;
  for (let i = 0; i < len; i++) {
    const declaration = bodyDecl[i];
    process(declaration, scope);
  }
}

function handleMethodDeclaration(methodDeclaration, scope) {
  const methodName = methodDeclaration.name.identifier;
  scope = scope.children[methodName];
  const statements = methodDeclaration.body.statements;
  const len = statements.length;
  // go through statements and add variables, if there is a type
  // declaration, create a new scope for that type
  for (let i = 0; i < len; i++) {
    const statement = statements[i];
    process(statement, scope);
  }
}

export default addMissingMethods;
