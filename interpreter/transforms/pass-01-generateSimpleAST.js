/**
 * As of 26/07/2023 this pass only extracts out the
 * AST of the main function.
 */
function extractMain(nodeType) {
  let publicCheck = false;
  let staticCheck = false;
  let voidCheck = false;
  let nameCheck = false;

  const bodyDecl = nodeType.bodyDeclarations;

  for (let i = 0; i < bodyDecl.length; i++) {
    const decl = bodyDecl[i];
    if ("name" in decl) {
      const id = decl.name.identifier;
      if (id === "main") {
        nameCheck = true;
      }
    }

    if ("modifiers" in decl) {
      const mods = decl.modifiers;
      for (let i = 0; i < mods.length; i++) {
        const mod = mods[i];
        switch (mod.keyword) {
          case "public":
            publicCheck = true;
            break;
          case "static":
            staticCheck = true;
            break;
        }
      }
    }

    if ("returnType2" in decl) {
      if (decl.returnType2.primitiveTypeCode === "void") {
        voidCheck = true;
      }
    }
    if (publicCheck && staticCheck && voidCheck && nameCheck) {
      return decl.body;
    }
  }
  return null;
}

/**
 * returns AST of the main method
 */
function getMain(types) {
  let mainAST = null;
  for(let i = 0; i < types.length; i++) {
    const nodeType = types[i];
    mainAST = extractMain(nodeType);
    if (mainAST !== null) {
      return mainAST;
    }
  }
  return null;
}

/**
 * Entry point to generate the simplified AST
 */
function generate(node) {
  let mainAST = null;
  if (node.node === "CompilationUnit") {
    mainAST = getMain(node.types);
  }

  return mainAST;
}

export default generate;
