{
   "node": "CompilationUnit",
   "types": [
      {
         "node": "TypeDeclaration",
         "name": {
            "identifier": "A",
            "node": "SimpleName"
         },
         "superInterfaceTypes": [],
         "superclassType": null,
         "bodyDeclarations": [
            {
               "node": "FieldDeclaration",
               "fragments": [
                  {
                     "node": "VariableDeclarationFragment",
                     "name": {
                        "identifier": "x",
                        "node": "SimpleName"
                     },
                     "extraDimensions": 0,
                     "initializer": null
                  }
               ],
               "type": {
                  "node": "PrimitiveType",
                  "primitiveTypeCode": "int"
               },
               "modifiers": []
            },
            {
               "parameters": [],
               "thrownExceptions": [],
               "body": {
                  "node": "Block",
                  "statements": [
                     {
                        "node": "SuperConstructorInvocation",
                        "arguments": [],
                        "expression": null,
                        "typeArguments": []
                     }
                  ]
               },
               "returnType2": null,
               "constructor": true,
               "extraDimensions": 0,
               "node": "MethodDeclaration",
               "name": {
                  "identifier": "A",
                  "node": "SimpleName"
               },
               "typeParameters": [],
               "modifiers": [
                  {
                     "node": "Modifier",
                     "keyword": "public"
                  }
               ]
            }
         ],
         "typeParameters": [],
         "interface": false,
         "modifiers": [
            {
               "node": "Modifier",
               "keyword": "public"
            }
         ],
         "comments": []
      },
      {
         "node": "TypeDeclaration",
         "name": {
            "identifier": "B",
            "node": "SimpleName"
         },
         "superInterfaceTypes": [],
         "superclassType": {
            "node": "SimpleType",
            "name": {
               "identifier": "A",
               "node": "SimpleName"
            }
         },
         "bodyDeclarations": [
            {
               "node": "FieldDeclaration",
               "fragments": [
                  {
                     "node": "VariableDeclarationFragment",
                     "name": {
                        "identifier": "x",
                        "node": "SimpleName"
                     },
                     "extraDimensions": 0,
                     "initializer": null
                  }
               ],
               "type": {
                  "node": "PrimitiveType",
                  "primitiveTypeCode": "int"
               },
               "modifiers": []
            },
            {
               "parameters": [],
               "thrownExceptions": [],
               "body": {
                  "node": "Block",
                  "statements": [
                     {
                        "node": "SuperConstructorInvocation",
                        "arguments": [],
                        "expression": null,
                        "typeArguments": []
                     }
                  ]
               },
               "returnType2": null,
               "constructor": true,
               "extraDimensions": 0,
               "node": "MethodDeclaration",
               "name": {
                  "identifier": "B",
                  "node": "SimpleName"
               },
               "typeParameters": [],
               "modifiers": [
                  {
                     "node": "Modifier",
                     "keyword": "public"
                  }
               ]
            }
         ],
         "typeParameters": [],
         "interface": false,
         "modifiers": [
            {
               "node": "Modifier",
               "keyword": "public"
            }
         ],
         "comments": []
      },
      {
         "node": "TypeDeclaration",
         "name": {
            "identifier": "C",
            "node": "SimpleName"
         },
         "superInterfaceTypes": [],
         "superclassType": null,
         "bodyDeclarations": [
            {
               "parameters": [],
               "thrownExceptions": [],
               "extraDimensions": 0,
               "body": {
                  "node": "Block",
                  "statements": [
                     {
                        "node": "VariableDeclarationStatement",
                        "fragments": [
                           {
                              "node": "VariableDeclarationFragment",
                              "name": {
                                 "identifier": "y",
                                 "node": "SimpleName"
                              },
                              "extraDimensions": 0,
                              "initializer": {
                                 "node": "NumberLiteral",
                                 "token": "10"
                              }
                           }
                        ],
                        "modifiers": [],
                        "type": {
                           "node": "PrimitiveType",
                           "primitiveTypeCode": "int"
                        }
                     },
                     {
                        "node": "TypeDeclarationStatement",
                        "declaration": {
                           "node": "TypeDeclaration",
                           "name": {
                              "identifier": "D",
                              "node": "SimpleName"
                           },
                           "superInterfaceTypes": [],
                           "superclassType": null,
                           "bodyDeclarations": [
                              {
                                 "node": "FieldDeclaration",
                                 "fragments": [
                                    {
                                       "node": "VariableDeclarationFragment",
                                       "name": {
                                          "identifier": "x",
                                          "node": "SimpleName"
                                       },
                                       "extraDimensions": 0,
                                       "initializer": null
                                    }
                                 ],
                                 "type": {
                                    "node": "PrimitiveType",
                                    "primitiveTypeCode": "int"
                                 },
                                 "modifiers": [
                                    {
                                       "node": "Modifier",
                                       "keyword": "public"
                                    }
                                 ]
                              },
                              {
                                 "parameters": [],
                                 "thrownExceptions": [],
                                 "body": {
                                    "node": "Block",
                                    "statements": [
                                       {
                                          "node": "SuperConstructorInvocation",
                                          "arguments": [],
                                          "expression": null,
                                          "typeArguments": []
                                       }
                                    ]
                                 },
                                 "returnType2": null,
                                 "constructor": true,
                                 "extraDimensions": 0,
                                 "node": "MethodDeclaration",
                                 "name": {
                                    "identifier": "D",
                                    "node": "SimpleName"
                                 },
                                 "typeParameters": [],
                                 "modifiers": [
                                    {
                                       "node": "Modifier",
                                       "keyword": "public"
                                    }
                                 ]
                              }
                           ],
                           "typeParameters": [],
                           "interface": false,
                           "modifiers": []
                        }
                     }
                  ]
               },
               "constructor": false,
               "node": "MethodDeclaration",
               "returnType2": {
                  "node": "PrimitiveType",
                  "primitiveTypeCode": "int"
               },
               "name": {
                  "identifier": "foo",
                  "node": "SimpleName"
               },
               "typeParameters": [],
               "modifiers": [
                  {
                     "node": "Modifier",
                     "keyword": "public"
                  }
               ]
            }
         ],
         "typeParameters": [],
         "interface": false,
         "modifiers": [
            {
               "node": "Modifier",
               "keyword": "public"
            }
         ],
         "comments": []
      }
   ],
   "package": null,
   "imports": []
}