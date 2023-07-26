export const blockAst = {
  parameters: [
    {
      node: "SingleVariableDeclaration",
      name: {
        identifier: "args",
        node: "SimpleName",
      },
      extraDimensions: 0,
      type: {
        node: "ArrayType",
        componentType: {
          node: "SimpleType",
          name: {
            identifier: "String",
            node: "SimpleName",
          },
        },
      },
      modifiers: [],
      varargs: false,
      initializer: null,
    },
  ],
  thrownExceptions: [],
  body: {
    node: "Block",
    statements: [
      {
        node: "VariableDeclarationStatement",
        fragments: [
          {
            node: "VariableDeclarationFragment",
            name: {
              identifier: "x",
              node: "SimpleName",
            },
            extraDimensions: 0,
            initializer: {
              node: "NumberLiteral",
              token: "0",
            },
            location: {
              start: {
                offset: 61,
                line: 3,
                column: 9,
              },
              end: {
                offset: 66,
                line: 3,
                column: 14,
              },
            },
          },
        ],
        modifiers: [],
        type: {
          node: "PrimitiveType",
          primitiveTypeCode: "int",
        },
        location: {
          start: {
            offset: 53,
            line: 3,
            column: 1,
          },
          end: {
            offset: 68,
            line: 4,
            column: 1,
          },
        },
      },
      {
        node: "VariableDeclarationStatement",
        fragments: [
          {
            node: "VariableDeclarationFragment",
            name: {
              identifier: "y",
              node: "SimpleName",
            },
            extraDimensions: 0,
            initializer: {
              node: "InfixExpression",
              operator: "+",
              leftOperand: {
                node: "NumberLiteral",
                token: "1",
              },
              rightOperand: {
                node: "NumberLiteral",
                token: "2",
              },
              location: {
                start: {
                  offset: 80,
                  line: 4,
                  column: 13,
                },
                end: {
                  offset: 85,
                  line: 4,
                  column: 18,
                },
              },
            },
            location: {
              start: {
                offset: 76,
                line: 4,
                column: 9,
              },
              end: {
                offset: 85,
                line: 4,
                column: 18,
              },
            },
          },
        ],
        modifiers: [],
        type: {
          node: "PrimitiveType",
          primitiveTypeCode: "int",
        },
        location: {
          start: {
            offset: 68,
            line: 4,
            column: 1,
          },
          end: {
            offset: 87,
            line: 5,
            column: 1,
          },
        },
      },
      {
        node: "LineEmpty",
      },
    ],
  },
  extraDimensions: 0,
  typeParameters: [],
  node: "MethodDeclaration",
  returnType2: {
    node: "PrimitiveType",
    primitiveTypeCode: "void",
  },
  name: {
    identifier: "main",
    node: "SimpleName",
  },
  constructor: false,
  modifiers: [
    {
      node: "Modifier",
      keyword: "public",
    },
    {
      node: "Modifier",
      keyword: "static",
    },
  ],
};
