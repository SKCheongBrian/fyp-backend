class ConstructorBuilder {
  nameObject;

  constructor(name) {
    this.nameObject = {identifier: name, node: "SimpleName"};
  }

  buildConstructor() {
    return {
      parameters: [],
      thrownExceptions: [],
      body: {
        node: "Block",
        statements: [],
      },
      returnType2: null,
      constructor: true,
      extraDimensions: 0,
      node: "MethodDeclaration",
      name: this.nameObject,
      typeParameters: [],
      modifiers: [
        {
          node: "Modifier",
          keyword: "public",
        },
      ],
    };
  }
}

export default ConstructorBuilder;
