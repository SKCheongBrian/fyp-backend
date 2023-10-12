import JavaError from "./java-error.js";

export default (function() {
  "use strict";

  function peg$subclass(child, parent) {
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
  }

  function peg$SyntaxError(message, expected, found, location) {
    this.message  = message;
    this.expected = expected;
    this.found    = found;
    this.location = location;
    this.name     = "SyntaxError";

    if (typeof Error.captureStackTrace === "function") {
      JavaError.captureStackTrace(this, peg$SyntaxError);
    }
  }

  peg$subclass(peg$SyntaxError, Error);

  peg$SyntaxError.buildMessage = function(expected, found) {
    var DESCRIBE_EXPECTATION_FNS = {
          literal: function(expectation) {
            return "\"" + literalEscape(expectation.text) + "\"";
          },

          "class": function(expectation) {
            var escapedParts = "",
                i;

            for (i = 0; i < expectation.parts.length; i++) {
              escapedParts += expectation.parts[i] instanceof Array
                ? classEscape(expectation.parts[i][0]) + "-" + classEscape(expectation.parts[i][1])
                : classEscape(expectation.parts[i]);
            }

            return "[" + (expectation.inverted ? "^" : "") + escapedParts + "]";
          },

          any: function(expectation) {
            return "any character";
          },

          end: function(expectation) {
            return "end of input";
          },

          other: function(expectation) {
            return expectation.description;
          }
        };

    function hex(ch) {
      return ch.charCodeAt(0).toString(16).toUpperCase();
    }

    function literalEscape(s) {
      return s
        .replace(/\\/g, '\\\\')
        .replace(/"/g,  '\\"')
        .replace(/\0/g, '\\0')
        .replace(/\t/g, '\\t')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
        .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
    }

    function classEscape(s) {
      return s
        .replace(/\\/g, '\\\\')
        .replace(/\]/g, '\\]')
        .replace(/\^/g, '\\^')
        .replace(/-/g,  '\\-')
        .replace(/\0/g, '\\0')
        .replace(/\t/g, '\\t')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
        .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
    }

    function describeExpectation(expectation) {
      return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
    }

    function describeExpected(expected) {
      var descriptions = new Array(expected.length),
          i, j;

      for (i = 0; i < expected.length; i++) {
        descriptions[i] = describeExpectation(expected[i]);
      }

      descriptions.sort();

      if (descriptions.length > 0) {
        for (i = 1, j = 1; i < descriptions.length; i++) {
          if (descriptions[i - 1] !== descriptions[i]) {
            descriptions[j] = descriptions[i];
            j++;
          }
        }
        descriptions.length = j;
      }

      switch (descriptions.length) {
        case 1:
          return descriptions[0];

        case 2:
          return descriptions[0] + " or " + descriptions[1];

        default:
          return descriptions.slice(0, -1).join(", ")
            + ", or "
            + descriptions[descriptions.length - 1];
      }
    }

    function describeFound(found) {
      return found ? "\"" + literalEscape(found) + "\"" : "end of input";
    }

    return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
  };

  function peg$parse(input, options) {
    options = options !== void 0 ? options : {};

    var peg$FAILED = {},

        peg$startRuleFunctions = { CompilationUnit: peg$parseCompilationUnit },
        peg$startRuleFunction  = peg$parseCompilationUnit,

        peg$c0 = function(pack, imports, types) {
                return {
                  node:    'CompilationUnit',
                  types:    skipNulls(types),
                  package:  pack,
                  imports:  skipNulls(imports)
                };
              },
        peg$c1 = function(leadComments, annot, name) {
                return {
                  node:       'PackageDeclaration',
                  name:        name,
                  annotations: annot,
                  comments:    leadComments
                };
              },
        peg$c2 = function(stat, name, asterisk) {
                return {
                  node:    'ImportDeclaration',
                  name:     name,
                  static:   !!stat,
                  onDemand: !!extractOptional(asterisk, 1)
                };
              },
        peg$c3 = function() { return null; },
        peg$c4 = function(leadComments, modifiers, type) { return mergeProps(type, { modifiers: modifiers, comments: leadComments }); },
        peg$c5 = function(id, gen, ext, impl, body) {
                return {
                  node:               'TypeDeclaration',
                  name:                id,
                  superInterfaceTypes: extractOptionalList(impl, 1),
                  superclassType:      extractOptional(ext, 1),
                  bodyDeclarations:    body,
                  typeParameters:      optionalList(gen),
                  interface:           false
                };
              },
        peg$c6 = function(decls) { return skipNulls(decls); },
        peg$c7 = function(modifier, body) {
                return {
                  node:     'Initializer',
                  body:      body,
                  modifiers: modifier === null ? [] : [makeModifier('static')]
                };
              },
        peg$c8 = function(modifiers, member) { return mergeProps(member, { modifiers: modifiers }); },
        peg$c9 = function(comment) { return { node: "EndOfLineComment", comment: comment.value }; },
        peg$c10 = function(comment) { return { node: "TraditionalComment", comment: comment.value }; },
        peg$c11 = function(comment) { return { node: "JavaDocComment", comment: comment.value }; },
        peg$c12 = /^[\r\n\f]/,
        peg$c13 = peg$classExpectation(["\r", "\n", "\f"], false, false),
        peg$c14 = function() { return { node: "LineEmpty" }; },
        peg$c15 = function(params, rest) { 
                return mergeProps(rest, {
                  node:          'MethodDeclaration',
                  typeParameters: params
                });
              },
        peg$c16 = function(type, id, rest) {
                return mergeProps(rest, {
                  node:          'MethodDeclaration',
                  returnType2:    type,
                  name:           id,
                  typeParameters: []
                });
              },
        peg$c17 = function(type, decls) {
                return {
                  node:     'FieldDeclaration',
                  fragments: decls,
                  type:      type
                };
              },
        peg$c18 = function(id, rest) {
                return mergeProps(rest, {
                  node:       'MethodDeclaration',
                  returnType2: makePrimitive('void'),
                  name:        id,
                  constructor: false
                });
              },
        peg$c19 = function(id, rest) { 
                return mergeProps(rest, {
                  node:           'MethodDeclaration',
                  name:            id,
                  typeParameters:  []
                });
              },
        peg$c20 = function() { return makePrimitive('void'); },
        peg$c21 = function(type, id, rest) {
                return mergeProps(rest, {
                  returnType2: type,
                  name:        id
                });
              },
        peg$c22 = function(id, rest) { return mergeProps(rest, { name: id }); },
        peg$c23 = function(params, dims, throws) { return null; },
        peg$c24 = function(params, dims, throws, body) {
                return {
                  parameters:       params,
                  thrownExceptions: extractThrowsClassType(extractOptionalList(throws, 1)),
                  extraDimensions:  dims.length,
                  body:             body,
                  constructor:      false
                };
              },
        peg$c25 = function(params, throws) { return null; },
        peg$c26 = function(params, throws, body) {
                return {
                  parameters:       params,
                  thrownExceptions: extractThrowsClassType(extractOptionalList(throws, 1)),
                  body:             body,
                  extraDimensions:  0,
                  typeParameters:   []
                };
              },
        peg$c27 = function(params, throws, body) {
                return {
                  parameters:       params,
                  thrownExceptions: extractThrowsClassType(extractOptionalList(throws, 1)),
                  body:             body,
                  returnType2:      null,
                  constructor:      true,
                  extraDimensions:  0
                };
              },
        peg$c28 = function(id, gen, ext, body) {
                return {
                    node:               'TypeDeclaration',
                    name:                id,
                    superInterfaceTypes: extractOptionalList(ext, 1),
                    superclassType:      null,
                    bodyDeclarations:    body,
                    typeParameters:      optionalList(gen),
                    interface:           true
                  };
              },
        peg$c29 = function(type, id, rest) {
                if (rest.node === 'FieldDeclaration') {
                  rest.fragments[0].name = id;
                  return mergeProps(rest, { type: type });
                } else {
                  return mergeProps(rest, { 
                    returnType2:    type, 
                    name:           id,
                    typeParameters: []
                  });
                }
              },
        peg$c30 = function(rest) { return { node: 'FieldDeclaration', fragments: rest }; },
        peg$c31 = function(params, dims, throws) {
                return {
                  node:            'MethodDeclaration',
                  parameters:       params,
                  thrownExceptions: extractThrowsClassType(extractOptionalList(throws, 1)),
                  extraDimensions:  dims.length,
                  body:             null,
                  constructor:      false
                };
              },
        peg$c32 = function(params) { return makePrimitive('void'); },
        peg$c33 = function(params, type, id, rest) {
                return mergeProps(rest, { 
                  returnType2:    type, 
                  name:           id, 
                  typeParameters: params 
                });
              },
        peg$c34 = function(params, throws) {
                return {
                  node:            'MethodDeclaration',
                  parameters:       params,
                  thrownExceptions: extractThrowsClassType(extractOptionalList(throws, 1)),
                  returnType2:      makePrimitive('void'),
                  extraDimensions:  0,
                  typeParameters:   [],
                  body:             null,
                  constructor:      false
                };
              },
        peg$c35 = function(first, rest) { return buildList(first, rest, 1); },
        peg$c36 = function(dims, init) { 
                  return {
                    node:           'VariableDeclarationFragment',
                    extraDimensions: dims.length,
                    initializer:     init
                }; 
              },
        peg$c37 = function(name, impl, eb) {
                return mergeProps(eb, {
                  node:               'EnumDeclaration',
                  name:                name,
                  superInterfaceTypes: extractOptionalList(impl, 1)
                });
              },
        peg$c38 = function(consts, body) {
                return {
                  enumConstants:    optionalList(consts),
                  bodyDeclarations: optionalList(body)
                };
              },
        peg$c39 = function(annot, name, args, cls) {
                return {
                  node:                     'EnumConstantDeclaration',
                  anonymousClassDeclaration: cls === null ? null : {
                    node:             'AnonymousClassDeclaration',
                    bodyDeclarations:  cls
                  },
                  arguments:                 optionalList(args),
                  modifiers:                 annot, 
                  name:                      name
                };
              },
        peg$c40 = function(decl) { return decl; },
        peg$c41 = function() { return makeModifier('final'); },
        peg$c42 = function(modifiers, type, decls) {
                return {
                  node:        'VariableDeclarationStatement',
                  fragments:    decls,
                  modifiers:    modifiers,
                  type:         type,
                  location: location()
                };
              },
        peg$c43 = function(name, dims, init) {
                return {
                  node:           'VariableDeclarationFragment',
                  name:            name,
                  extraDimensions: dims.length,
                  initializer:     extractOptional(init, 1),
                  location: location()
                };
              },
        peg$c44 = function(params) { return optionalList(params); },
        peg$c45 = function(modifiers, type, decl) { 
                return mergeProps(decl, {
                  type:        type,
                  modifiers:   modifiers,
                  varargs:     false,
                  initializer: null
                });
              },
        peg$c46 = function(modifiers, type, decl) { 
                return mergeProps(decl, {
                  type:        type,
                  modifiers:   modifiers,
                  varargs:     true,
                  initializer: null
                });
              },
        peg$c47 = function(first, rest, last) { return buildList(first, rest, 1).concat(extractOptionalList(last, 1)); },
        peg$c48 = function(last) { return [last]; },
        peg$c49 = function(id, dims) { 
                return { 
                  node:           'SingleVariableDeclaration', 
                  name:            id, 
                  extraDimensions: dims.length 
                }; 
              },
        peg$c50 = function(statements) { 
                return {
                  node:      'Block',
                  statements: statements
                }
              },
        peg$c51 = function(modifiers, decl) { 
                return { 
                  node:       'TypeDeclarationStatement', 
                  declaration: mergeProps(decl,  { modifiers: modifiers }),
                  location: location()
                }; 
              },
        peg$c52 = function(expr, message) { 
                return { 
                  node:      'AssertStatement', 
                  expression: expr,
                  message:    extractOptional(message, 1),
                  location: location()
                }; 
              },
        peg$c53 = function(expr, then, alt) { 
                return { 
                  node:         'IfStatement', 
                  elseStatement: extractOptional(alt, 1), 
                  thenStatement: then,
                  expression:    expr.expression,
                  location: location()
                }; 
              },
        peg$c54 = function(init, expr, up, body) { 
                return {
                  node:        'ForStatement',
                  initializers: optionalList(init),
                  expression:   expr,
                  updaters:     optionalList(up),
                  body:         body,
                  location: location()
                };
              },
        peg$c55 = function(param, expr, statement) {       
                return {
                  node:      'EnhancedForStatement',
                  parameter:  param,
                  expression: expr,
                  body:       statement,
                  location: location()
                }; 
              },
        peg$c56 = function(expr, body) { 
                return { 
                  node:      'WhileStatement', 
                  expression: expr.expression, 
                  body:       body,
                  location: location()
                };
              },
        peg$c57 = function(statement, expr) { 
                return { 
                  node:      'DoStatement', 
                  expression: expr.expression, 
                  body:       statement,
                  location: location()
                };  
              },
        peg$c58 = function(first, rest, body, cat, fin) { 
                return mergeProps(makeCatchFinally(cat, fin), {
                  node:        'TryStatement',
                  body:         body,
                  resources:    buildList(first, rest, 1),
                  location: location()
                });
              },
        peg$c59 = function(body, cat, fin) { return makeCatchFinally(cat, fin); },
        peg$c60 = function(body, fin) { return makeCatchFinally([], fin); },
        peg$c61 = function(body, rest) { 
                return mergeProps(rest, {
                  node:        'TryStatement',
                  body:         body,
                  resources:    []
                });
              },
        peg$c62 = function(expr, cases) { return { node: 'SwitchStatement', statements: cases, expression: expr.expression, location: location() }; },
        peg$c63 = function(expr, body) { return { node: 'SynchronizedStatement', expression: expr.expression, body: body, location: location() } },
        peg$c64 = function(expr) { return { node: 'ReturnStatement', expression: expr, location: location() } },
        peg$c65 = function(expr) { return { node: 'ThrowStatement', expression: expr, location: location() }; },
        peg$c66 = function(id) { return { node: 'BreakStatement', label: id, location: location() }; },
        peg$c67 = function(id) { return { node: 'ContinueStatement', label: id, location: location() }; },
        peg$c68 = function() { return { node: 'EmptyStatement', location: location() }; },
        peg$c69 = function(statement) { return statement; },
        peg$c70 = function(id, statement) { return { node: 'LabeledStatement', label: id, body: statement, location: location() }; },
        peg$c71 = function(modifiers, type, decl, expr) { 
                var fragment = mergeProps(decl, { initializer: expr });
                fragment.node = 'VariableDeclarationFragment';
                return {
                  node:     'VariableDeclarationExpression',
                  modifiers: modifiers,
                  type:      type,
                  fragments: [fragment],
                  location: location()
                }; 
              },
        peg$c72 = function(modifiers, first, rest, decl, body) {
                return {
                  node:       'CatchClause',
                  body:        body,
                  exception:   mergeProps(decl, {
                    modifiers:   modifiers,
                    initializer: null,
                    varargs:     false,
                    type:        rest.length ? { 
                      node: 'UnionType', 
                      types: buildList(first, rest, 1) 
                      } : first
                  }),
                  location: location()
                };
              },
        peg$c73 = function(block) { return block; },
        peg$c74 = function(blocks) { return [].concat.apply([], blocks); },
        peg$c75 = function(expr, blocks) { return [{ node: 'SwitchCase', expression: expr }].concat(blocks); },
        peg$c76 = function(expr) { return expr; },
        peg$c77 = function(modifiers, type, decls) { 
                return [{
                  node:     'VariableDeclarationExpression',
                  modifiers: modifiers,
                  fragments: decls,
                  type:      type,
                  location: location()
                }]; 
              },
        peg$c78 = function(first, rest) { return extractExpressions(buildList(first, rest, 1)); },
        peg$c79 = function(expr) { 
                switch(expr.node) {
                  case 'SuperConstructorInvocation':
                  case 'ConstructorInvocation':
                    return expr;
                  default:
                    return { 
                      node:      'ExpressionStatement', 
                      expression: expr,
                      location: location()
                    };  
                }
              },
        peg$c80 = function(left, op, right) {
                return {
                  node:         'Assignment',
                  operator:      op[0] /* remove ending spaces */,
                  leftHandSide:  left,
                  rightHandSide: right,
                  location: location()
                };
              },
        peg$c81 = function(left) { return { node: "SimpleName", identifier: "new" }; },
        peg$c82 = function(left, right) {
                return {
                  node: 'MethodReference',
                  class: left,
                  method: right,
                  location: location()
                };
              },
        peg$c83 = function(args, body) {
                return {
                  node: 'LambdaExpression',
                  args: args,
                  body: body,
                  location: location()
                };
              },
        peg$c84 = function(id, body) {
                return {
                  node: 'LambdaExpression',
                  args: [id],
                  body: body,
                  location: location()
                };
              },
        peg$c85 = function(body) { return body; },
        peg$c86 = function(statement) {
                return {
                  node:      'Block',
                  statements: [statement],
                  location: location()
                }
              },
        peg$c87 = function(expr, then, alt) {
                return {
                  node:          'ConditionalExpression',
                  expression:     expr,
                  thenExpression: then,
                  elseExpression: alt,
                  location: location()
                };
              },
        peg$c88 = function(first, rest) { return buildInfixExpr(first, rest); },
        peg$c89 = function(first, rest) {
                return buildTree(first, rest, function(result, element) {
                  return element[0][0] === 'instanceof' ? {
                    node:        'InstanceofExpression',
                    leftOperand:  result,
                    rightOperand: element[1],
                    location: location()
                  } : {
                    node:        'InfixExpression',
                    operator:     element[0][0], // remove ending Spacing
                    leftOperand:  result,
                    rightOperand: element[1],
                    location: location()
                  };
                });
              },
        peg$c90 = function(operator, operand) {
                return operand.node === 'NumberLiteral' && operator === '-' && 
                  (operand.token === '9223372036854775808L' || 
                   operand.token === '9223372036854775808l' ||
                   operand.token === '2147483648') 
                  ? { node: 'NumberLiteral', token: text() }
                  : { 
                    node:    'PrefixExpression', 
                    operator: operator, 
                    operand:  operand
                  };
              },
        peg$c91 = function(expr) {
                return {
                  node:      'CastExpression',
                  type:       expr[1],     
                  expression: expr[3],
                  location: location()
                };
              },
        peg$c92 = function(arg, sel, sels, operator) { 
                return operator.length > 1 ? TODO(/* JLS7? */) : {
                  node:    'PostfixExpression', 
                  operator: operator[0], 
                  operand:  buildSelectorTree(arg, sel, sels),
                  location: location()
                };
              },
        peg$c93 = function(arg, sel, sels) { return buildSelectorTree(arg, sel, sels); },
        peg$c94 = function(arg, operator) { 
                return operator.length > 1 ? TODO(/* JLS7? */) : {
                  node:    'PostfixExpression', 
                  operator: operator[0], 
                  operand:  arg,
                  location: location()
                };
              },
        peg$c95 = function(args, args_r) { return { node: 'ConstructorInvocation', arguments: args_r, typeArguments: [] }; },
        peg$c96 = function(args, ret) { 
                if (ret.typeArguments.length) return TODO(/* Ugly ! */);
                ret.typeArguments = args;
                return ret;
              },
        peg$c97 = function(args) { 
                return args === null ? {
                  node:     'ThisExpression',
                  qualifier: null,
                  location: location()
                } : { 
                  node:         'ConstructorInvocation', 
                  arguments:     args, 
                  typeArguments: [] ,
                  location: location()
                }; 
              },
        peg$c98 = function(suffix) { 
                return suffix.node === 'SuperConstructorInvocation' 
                  ? suffix
                  : mergeProps(suffix, { qualifier: null }); 
              },
        peg$c99 = function(creator) { return creator; },
        peg$c100 = function(type, dims) {
                return {
                  node: 'TypeLiteral',
                  type:  buildArrayTree(type, dims),
                  location: location()
                };
              },
        peg$c101 = function() {
                return {
                  node: 'TypeLiteral',
                  type:  makePrimitive('void'),
                  location: location()
                };
              },
        peg$c102 = function(qual, dims) { 
                return {
                  node: 'TypeLiteral',
                  type:  buildArrayTree(buildTypeName(qual, null, []), dims),
                  location: location()
                };
              },
        peg$c103 = function(qual, expr) { return { node: 'ArrayAccess', array: qual, index: expr }; },
        peg$c104 = function(qual, args) { 
                return mergeProps(popQualified(qual), { 
                  node:         'MethodInvocation', 
                  arguments:     args, 
                  typeArguments: [],
                  location: location()
                }); 
              },
        peg$c105 = function(qual) { return { node: 'TypeLiteral', type: buildTypeName(qual, null, []), location: location() }; },
        peg$c106 = function(qual, ret) { 
                if (ret.expression) return TODO(/* Ugly ! */);
                ret.expression = qual;
                return ret; 
              },
        peg$c107 = function(qual) { return { node: 'ThisExpression', qualifier: qual }; },
        peg$c108 = function(qual, args) {
                return { 
                  node:         'SuperConstructorInvocation', 
                  arguments:     args, 
                  expression:    qual,
                  typeArguments: []
                };  
              },
        peg$c109 = function(qual, args, rest) { return mergeProps(rest, { expression: qual, typeArguments: optionalList(args) }); },
        peg$c110 = function() { return []; },
        peg$c111 = function(suffix) { return suffix; },
        peg$c112 = function(id, args) { return { node: 'MethodInvocation', arguments: args, name: id, typeArguments: [], location: location() }; },
        peg$c113 = function(op) { return op[0]; /* remove ending spaces */ },
        peg$c114 = function(id) { return { node: 'FieldAccess', name: id, location: location() }; },
        peg$c115 = function(ret) { return ret; },
        peg$c116 = function() { return TODO(/* Any sample ? */); },
        peg$c117 = function(args, ret) { return mergeProps(ret, { typeArguments: optionalList(args) }); },
        peg$c118 = function(expr) { return { node: 'ArrayAccess', index: expr, location: location() }; },
        peg$c119 = function(args) { 
                return { 
                  node:         'SuperConstructorInvocation', 
                  arguments:     args, 
                  expression:    null,
                  typeArguments: [],
                  location: location()
                }; 
              },
        peg$c120 = function(gen, id, args) { 
                return args === null ? {
                  node: 'SuperFieldAccess',
                  name:  id,
                  location: location()
                } : { 
                  node:         'SuperMethodInvocation', 
                  typeArguments: optionalList(gen),
                  name:          id, 
                  arguments:     args,
                  location: location()
                }; 
              },
        peg$c121 = "byte",
        peg$c122 = peg$literalExpectation("byte", false),
        peg$c123 = "short",
        peg$c124 = peg$literalExpectation("short", false),
        peg$c125 = "char",
        peg$c126 = peg$literalExpectation("char", false),
        peg$c127 = "int",
        peg$c128 = peg$literalExpectation("int", false),
        peg$c129 = "long",
        peg$c130 = peg$literalExpectation("long", false),
        peg$c131 = "float",
        peg$c132 = peg$literalExpectation("float", false),
        peg$c133 = "double",
        peg$c134 = peg$literalExpectation("double", false),
        peg$c135 = "boolean",
        peg$c136 = peg$literalExpectation("boolean", false),
        peg$c137 = function(type) { return makePrimitive(type); },
        peg$c138 = function(args) { return optionalList(args); },
        peg$c139 = function(type, rest) { 
                return  { 
                  node:       'ArrayCreation', 
                  type:        buildArrayTree(type, rest.extraDims), 
                  initializer: rest.init,
                  dimensions:  rest.dimms
                }; 
              },
        peg$c140 = function(args, type, rest) {
                return mergeProps(rest, {
                  node:          'ClassInstanceCreation',
                  type:           type,
                  typeArguments:  args,
                  expression:     null
                });
              },
        peg$c141 = function(qual, args, rest) { return buildTypeName(qual, args, rest); },
        peg$c142 = function(id, args, rest) { 
                return mergeProps(rest, {
                  node: 'ClassInstanceCreation',
                  type:  buildTypeName(id, args, [])
                });  
              },
        peg$c143 = function(args, body) {
                return {
                  arguments:                 args,
                  anonymousClassDeclaration: body === null ? null : {
                    node:            'AnonymousClassDeclaration',
                    bodyDeclarations: body
                  }
                };
              },
        peg$c144 = function(dims, init) { return { extraDims:dims, init:init, dimms: [] }; },
        peg$c145 = function(dimexpr, dims) { return { extraDims:dimexpr.concat(dims), init:null, dimms: dimexpr }; },
        peg$c146 = function(dim) { return { extraDims:[dim], init:null, dimms: [] }; },
        peg$c147 = function(init) { return { node: 'ArrayInitializer', expressions: optionalList(init) }; },
        peg$c148 = function(expr) { return { node: 'ParenthesizedExpression', expression: expr }; },
        peg$c149 = function(first, rest) { return buildQualified(first, rest, 1); },
        peg$c150 = function(exp) { return exp; },
        peg$c151 = function(type, dims) { return buildArrayTree(type, dims); },
        peg$c152 = function(bas, dims) { return buildArrayTree(bas, dims); },
        peg$c153 = function(cls, dims) { return buildArrayTree(cls, dims); },
        peg$c154 = function(refType) { return refType; },
        peg$c155 = function() { return true; },
        peg$c156 = function() { return false; },
        peg$c157 = function(rest) {
                return {
                  node:      'WildcardType',
                  upperBound: extractOptional(rest, 0, true),
                  bound:      extractOptional(rest, 1)
                }; 
              },
        peg$c158 = function(id, bounds) { 
                return {
                  node:      'TypeParameter',
                  name:       id,
                  typeBounds: extractOptionalList(bounds, 1)
                };
              },
        peg$c159 = function() { return { node: 'WildcardType' }; },
        peg$c160 = "public",
        peg$c161 = peg$literalExpectation("public", false),
        peg$c162 = "protected",
        peg$c163 = peg$literalExpectation("protected", false),
        peg$c164 = "private",
        peg$c165 = peg$literalExpectation("private", false),
        peg$c166 = "static",
        peg$c167 = peg$literalExpectation("static", false),
        peg$c168 = "abstract",
        peg$c169 = peg$literalExpectation("abstract", false),
        peg$c170 = "final",
        peg$c171 = peg$literalExpectation("final", false),
        peg$c172 = "native",
        peg$c173 = peg$literalExpectation("native", false),
        peg$c174 = "synchronized",
        peg$c175 = peg$literalExpectation("synchronized", false),
        peg$c176 = "transient",
        peg$c177 = peg$literalExpectation("transient", false),
        peg$c178 = "volatile",
        peg$c179 = peg$literalExpectation("volatile", false),
        peg$c180 = "strictfp",
        peg$c181 = peg$literalExpectation("strictfp", false),
        peg$c182 = function(keyword) { return makeModifier(keyword); },
        peg$c183 = function(id, body) { 
                return {
                  node:            'AnnotationTypeDeclaration',
                  name:             id,
                  bodyDeclarations: body
                }; 
              },
        peg$c184 = function(decl) { return skipNulls(decl); },
        peg$c185 = function(modifiers, rest) { return mergeProps(rest, { modifiers: modifiers }); },
        peg$c186 = function(type, rest) { return mergeProps(rest, { type: type }); },
        peg$c187 = function(id, def) { 
                return { 
                  node:   'AnnotationTypeMemberDeclaration', 
                  name:    id, 
                  default: def 
                }; 
              },
        peg$c188 = function(fragments) { return { node: 'FieldDeclaration', fragments: fragments }; },
        peg$c189 = function(val) { return val; },
        peg$c190 = function(id, pairs) { 
                return { 
                  node:    'NormalAnnotation', 
                  typeName: id, 
                  values:   optionalList(pairs)
                }; 
              },
        peg$c191 = function(id, value) { 
                return { 
                  node:    'SingleMemberAnnotation', 
                  typeName: id, 
                  value:    value 
                }; 
              },
        peg$c192 = function(id) { return { node: 'MarkerAnnotation', typeName: id }; },
        peg$c193 = function(name, value) { 
                return {
                  node: 'MemberValuePair',
                  name:  name,
                  value: value
                };
              },
        peg$c194 = function(values) { return { node: 'ArrayInitializer', expressions: optionalList(values)}; },
        peg$c195 = /^[ \t]/,
        peg$c196 = peg$classExpectation([" ", "\t"], false, false),
        peg$c197 = /^[ \t\r\n\f]/,
        peg$c198 = peg$classExpectation([" ", "\t", "\r", "\n", "\f"], false, false),
        peg$c199 = function(commentStatements) { return leadingComments(commentStatements); },
        peg$c200 = function(comment) { return comment; },
        peg$c201 = function(commentStatement) { return commentStatement; },
        peg$c202 = "/**",
        peg$c203 = peg$literalExpectation("/**", false),
        peg$c204 = "*/",
        peg$c205 = peg$literalExpectation("*/", false),
        peg$c206 = function(comment) { return { value: "/**" + comment.join("") + "*/" }; },
        peg$c207 = "/*",
        peg$c208 = peg$literalExpectation("/*", false),
        peg$c209 = "*",
        peg$c210 = peg$literalExpectation("*", false),
        peg$c211 = "/",
        peg$c212 = peg$literalExpectation("/", false),
        peg$c213 = function(comment) { return { value: "/*" + comment.join("") + "*/" }; },
        peg$c214 = function(letter) { return letter[1]; },
        peg$c215 = "//",
        peg$c216 = peg$literalExpectation("//", false),
        peg$c217 = function(comment) { return { value: "//" + comment.join("") }; },
        peg$c218 = function(first, rest) { return { identifier: first + rest, node: 'SimpleName' }; },
        peg$c219 = /^[a-z]/,
        peg$c220 = peg$classExpectation([["a", "z"]], false, false),
        peg$c221 = /^[A-Z]/,
        peg$c222 = peg$classExpectation([["A", "Z"]], false, false),
        peg$c223 = /^[_$]/,
        peg$c224 = peg$classExpectation(["_", "$"], false, false),
        peg$c225 = /^[0-9]/,
        peg$c226 = peg$classExpectation([["0", "9"]], false, false),
        peg$c227 = "assert",
        peg$c228 = peg$literalExpectation("assert", false),
        peg$c229 = "break",
        peg$c230 = peg$literalExpectation("break", false),
        peg$c231 = "case",
        peg$c232 = peg$literalExpectation("case", false),
        peg$c233 = "catch",
        peg$c234 = peg$literalExpectation("catch", false),
        peg$c235 = "class",
        peg$c236 = peg$literalExpectation("class", false),
        peg$c237 = "const",
        peg$c238 = peg$literalExpectation("const", false),
        peg$c239 = "continue",
        peg$c240 = peg$literalExpectation("continue", false),
        peg$c241 = "default",
        peg$c242 = peg$literalExpectation("default", false),
        peg$c243 = "do",
        peg$c244 = peg$literalExpectation("do", false),
        peg$c245 = "else",
        peg$c246 = peg$literalExpectation("else", false),
        peg$c247 = "enum",
        peg$c248 = peg$literalExpectation("enum", false),
        peg$c249 = "extends",
        peg$c250 = peg$literalExpectation("extends", false),
        peg$c251 = "false",
        peg$c252 = peg$literalExpectation("false", false),
        peg$c253 = "finally",
        peg$c254 = peg$literalExpectation("finally", false),
        peg$c255 = "for",
        peg$c256 = peg$literalExpectation("for", false),
        peg$c257 = "goto",
        peg$c258 = peg$literalExpectation("goto", false),
        peg$c259 = "if",
        peg$c260 = peg$literalExpectation("if", false),
        peg$c261 = "implements",
        peg$c262 = peg$literalExpectation("implements", false),
        peg$c263 = "import",
        peg$c264 = peg$literalExpectation("import", false),
        peg$c265 = "interface",
        peg$c266 = peg$literalExpectation("interface", false),
        peg$c267 = "instanceof",
        peg$c268 = peg$literalExpectation("instanceof", false),
        peg$c269 = "new",
        peg$c270 = peg$literalExpectation("new", false),
        peg$c271 = "null",
        peg$c272 = peg$literalExpectation("null", false),
        peg$c273 = "package",
        peg$c274 = peg$literalExpectation("package", false),
        peg$c275 = "return",
        peg$c276 = peg$literalExpectation("return", false),
        peg$c277 = "super",
        peg$c278 = peg$literalExpectation("super", false),
        peg$c279 = "switch",
        peg$c280 = peg$literalExpectation("switch", false),
        peg$c281 = "this",
        peg$c282 = peg$literalExpectation("this", false),
        peg$c283 = "throws",
        peg$c284 = peg$literalExpectation("throws", false),
        peg$c285 = "throw",
        peg$c286 = peg$literalExpectation("throw", false),
        peg$c287 = "true",
        peg$c288 = peg$literalExpectation("true", false),
        peg$c289 = "try",
        peg$c290 = peg$literalExpectation("try", false),
        peg$c291 = "void",
        peg$c292 = peg$literalExpectation("void", false),
        peg$c293 = "while",
        peg$c294 = peg$literalExpectation("while", false),
        peg$c295 = function() { return { node: 'BooleanLiteral', booleanValue: true }; },
        peg$c296 = function() { return { node: 'BooleanLiteral', booleanValue: false }; },
        peg$c297 = function() { return { node: 'NullLiteral' }; },
        peg$c298 = function(literal) { return literal; },
        peg$c299 = /^[lL]/,
        peg$c300 = peg$classExpectation(["l", "L"], false, false),
        peg$c301 = function() { return { node: 'NumberLiteral', token: text() }; },
        peg$c302 = "0",
        peg$c303 = peg$literalExpectation("0", false),
        peg$c304 = /^[1-9]/,
        peg$c305 = peg$classExpectation([["1", "9"]], false, false),
        peg$c306 = /^[_]/,
        peg$c307 = peg$classExpectation(["_"], false, false),
        peg$c308 = "0x",
        peg$c309 = peg$literalExpectation("0x", false),
        peg$c310 = "0X",
        peg$c311 = peg$literalExpectation("0X", false),
        peg$c312 = "0b",
        peg$c313 = peg$literalExpectation("0b", false),
        peg$c314 = "0B",
        peg$c315 = peg$literalExpectation("0B", false),
        peg$c316 = /^[01]/,
        peg$c317 = peg$classExpectation(["0", "1"], false, false),
        peg$c318 = /^[0-7]/,
        peg$c319 = peg$classExpectation([["0", "7"]], false, false),
        peg$c320 = ".",
        peg$c321 = peg$literalExpectation(".", false),
        peg$c322 = /^[fFdD]/,
        peg$c323 = peg$classExpectation(["f", "F", "d", "D"], false, false),
        peg$c324 = /^[eE]/,
        peg$c325 = peg$classExpectation(["e", "E"], false, false),
        peg$c326 = /^[+\-]/,
        peg$c327 = peg$classExpectation(["+", "-"], false, false),
        peg$c328 = /^[pP]/,
        peg$c329 = peg$classExpectation(["p", "P"], false, false),
        peg$c330 = /^[a-f]/,
        peg$c331 = peg$classExpectation([["a", "f"]], false, false),
        peg$c332 = /^[A-F]/,
        peg$c333 = peg$classExpectation([["A", "F"]], false, false),
        peg$c334 = "'",
        peg$c335 = peg$literalExpectation("'", false),
        peg$c336 = /^['\\\n\r]/,
        peg$c337 = peg$classExpectation(["'", "\\", "\n", "\r"], false, false),
        peg$c338 = function() { return { node: 'CharacterLiteral', escapedValue: text() }; },
        peg$c339 = "\"",
        peg$c340 = peg$literalExpectation("\"", false),
        peg$c341 = /^["\\\n\r]/,
        peg$c342 = peg$classExpectation(["\"", "\\", "\n", "\r"], false, false),
        peg$c343 = function() { return { node: 'StringLiteral', escapedValue: text() }; },
        peg$c344 = "\\",
        peg$c345 = peg$literalExpectation("\\", false),
        peg$c346 = /^[btnfr"'\\]/,
        peg$c347 = peg$classExpectation(["b", "t", "n", "f", "r", "\"", "'", "\\"], false, false),
        peg$c348 = /^[0-3]/,
        peg$c349 = peg$classExpectation([["0", "3"]], false, false),
        peg$c350 = "u",
        peg$c351 = peg$literalExpectation("u", false),
        peg$c352 = "@",
        peg$c353 = peg$literalExpectation("@", false),
        peg$c354 = "&",
        peg$c355 = peg$literalExpectation("&", false),
        peg$c356 = /^[=&]/,
        peg$c357 = peg$classExpectation(["=", "&"], false, false),
        peg$c358 = "&&",
        peg$c359 = peg$literalExpectation("&&", false),
        peg$c360 = "&=",
        peg$c361 = peg$literalExpectation("&=", false),
        peg$c362 = "!",
        peg$c363 = peg$literalExpectation("!", false),
        peg$c364 = "=",
        peg$c365 = peg$literalExpectation("=", false),
        peg$c366 = ">>>",
        peg$c367 = peg$literalExpectation(">>>", false),
        peg$c368 = ">>>=",
        peg$c369 = peg$literalExpectation(">>>=", false),
        peg$c370 = ":",
        peg$c371 = peg$literalExpectation(":", false),
        peg$c372 = "::",
        peg$c373 = peg$literalExpectation("::", false),
        peg$c374 = ",",
        peg$c375 = peg$literalExpectation(",", false),
        peg$c376 = "--",
        peg$c377 = peg$literalExpectation("--", false),
        peg$c378 = "/=",
        peg$c379 = peg$literalExpectation("/=", false),
        peg$c380 = "...",
        peg$c381 = peg$literalExpectation("...", false),
        peg$c382 = "==",
        peg$c383 = peg$literalExpectation("==", false),
        peg$c384 = ">=",
        peg$c385 = peg$literalExpectation(">=", false),
        peg$c386 = ">",
        peg$c387 = peg$literalExpectation(">", false),
        peg$c388 = /^[=>]/,
        peg$c389 = peg$classExpectation(["=", ">"], false, false),
        peg$c390 = "^",
        peg$c391 = peg$literalExpectation("^", false),
        peg$c392 = "^=",
        peg$c393 = peg$literalExpectation("^=", false),
        peg$c394 = "++",
        peg$c395 = peg$literalExpectation("++", false),
        peg$c396 = "[",
        peg$c397 = peg$literalExpectation("[", false),
        peg$c398 = "<=",
        peg$c399 = peg$literalExpectation("<=", false),
        peg$c400 = "(",
        peg$c401 = peg$literalExpectation("(", false),
        peg$c402 = "<",
        peg$c403 = peg$literalExpectation("<", false),
        peg$c404 = /^[=<]/,
        peg$c405 = peg$classExpectation(["=", "<"], false, false),
        peg$c406 = "{",
        peg$c407 = peg$literalExpectation("{", false),
        peg$c408 = "-",
        peg$c409 = peg$literalExpectation("-", false),
        peg$c410 = /^[=\-]/,
        peg$c411 = peg$classExpectation(["=", "-"], false, false),
        peg$c412 = "-=",
        peg$c413 = peg$literalExpectation("-=", false),
        peg$c414 = "%",
        peg$c415 = peg$literalExpectation("%", false),
        peg$c416 = "%=",
        peg$c417 = peg$literalExpectation("%=", false),
        peg$c418 = "!=",
        peg$c419 = peg$literalExpectation("!=", false),
        peg$c420 = "|",
        peg$c421 = peg$literalExpectation("|", false),
        peg$c422 = /^[=|]/,
        peg$c423 = peg$classExpectation(["=", "|"], false, false),
        peg$c424 = "|=",
        peg$c425 = peg$literalExpectation("|=", false),
        peg$c426 = "||",
        peg$c427 = peg$literalExpectation("||", false),
        peg$c428 = "+",
        peg$c429 = peg$literalExpectation("+", false),
        peg$c430 = /^[=+]/,
        peg$c431 = peg$classExpectation(["=", "+"], false, false),
        peg$c432 = "+=",
        peg$c433 = peg$literalExpectation("+=", false),
        peg$c434 = "->",
        peg$c435 = peg$literalExpectation("->", false),
        peg$c436 = "?",
        peg$c437 = peg$literalExpectation("?", false),
        peg$c438 = "]",
        peg$c439 = peg$literalExpectation("]", false),
        peg$c440 = ")",
        peg$c441 = peg$literalExpectation(")", false),
        peg$c442 = "}",
        peg$c443 = peg$literalExpectation("}", false),
        peg$c444 = ";",
        peg$c445 = peg$literalExpectation(";", false),
        peg$c446 = "<<",
        peg$c447 = peg$literalExpectation("<<", false),
        peg$c448 = "<<=",
        peg$c449 = peg$literalExpectation("<<=", false),
        peg$c450 = ">>",
        peg$c451 = peg$literalExpectation(">>", false),
        peg$c452 = ">>=",
        peg$c453 = peg$literalExpectation(">>=", false),
        peg$c454 = "*=",
        peg$c455 = peg$literalExpectation("*=", false),
        peg$c456 = "~",
        peg$c457 = peg$literalExpectation("~", false),
        peg$c458 = peg$anyExpectation(),

        peg$currPos          = 0,
        peg$savedPos         = 0,
        peg$posDetailsCache  = [{ line: 1, column: 1 }],
        peg$maxFailPos       = 0,
        peg$maxFailExpected  = [],
        peg$silentFails      = 0,

        peg$result;

    if ("startRule" in options) {
      if (!(options.startRule in peg$startRuleFunctions)) {
        throw new JavaError("Can't start parsing from rule \"" + options.startRule + "\".");
      }

      peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
    }

    function text() {
      return input.substring(peg$savedPos, peg$currPos);
    }

    function location() {
      return peg$computeLocation(peg$savedPos, peg$currPos);
    }

    function expected(description, location) {
      location = location !== void 0 ? location : peg$computeLocation(peg$savedPos, peg$currPos)

      throw peg$buildStructuredError(
        [peg$otherExpectation(description)],
        input.substring(peg$savedPos, peg$currPos),
        location
      );
    }

    function error(message, location) {
      location = location !== void 0 ? location : peg$computeLocation(peg$savedPos, peg$currPos)

      throw peg$buildSimpleError(message, location);
    }

    function peg$literalExpectation(text, ignoreCase) {
      return { type: "literal", text: text, ignoreCase: ignoreCase };
    }

    function peg$classExpectation(parts, inverted, ignoreCase) {
      return { type: "class", parts: parts, inverted: inverted, ignoreCase: ignoreCase };
    }

    function peg$anyExpectation() {
      return { type: "any" };
    }

    function peg$endExpectation() {
      return { type: "end" };
    }

    function peg$otherExpectation(description) {
      return { type: "other", description: description };
    }

    function peg$computePosDetails(pos) {
      var details = peg$posDetailsCache[pos], p;

      if (details) {
        return details;
      } else {
        p = pos - 1;
        while (!peg$posDetailsCache[p]) {
          p--;
        }

        details = peg$posDetailsCache[p];
        details = {
          line:   details.line,
          column: details.column
        };

        while (p < pos) {
          if (input.charCodeAt(p) === 10) {
            details.line++;
            details.column = 1;
          } else {
            details.column++;
          }

          p++;
        }

        peg$posDetailsCache[pos] = details;
        return details;
      }
    }

    function peg$computeLocation(startPos, endPos) {
      var startPosDetails = peg$computePosDetails(startPos),
          endPosDetails   = peg$computePosDetails(endPos);

      return {
        start: {
          offset: startPos,
          line:   startPosDetails.line,
          column: startPosDetails.column
        },
        end: {
          offset: endPos,
          line:   endPosDetails.line,
          column: endPosDetails.column
        }
      };
    }

    function peg$fail(expected) {
      if (peg$currPos < peg$maxFailPos) { return; }

      if (peg$currPos > peg$maxFailPos) {
        peg$maxFailPos = peg$currPos;
        peg$maxFailExpected = [];
      }

      peg$maxFailExpected.push(expected);
    }

    function peg$buildSimpleError(message, location) {
      return new peg$SyntaxError(message, null, null, location);
    }

    function peg$buildStructuredError(expected, found, location) {
      return new peg$SyntaxError(
        peg$SyntaxError.buildMessage(expected, found),
        expected,
        found,
        location
      );
    }

    function peg$parseCompilationUnit() {
      var s0, s1, s2, s3, s4, s5, s6;

      s0 = peg$currPos;
      s1 = peg$parseSpacing();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsePackageDeclaration();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseImportDeclaration();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parseImportDeclaration();
          }
          if (s3 !== peg$FAILED) {
            s4 = [];
            s5 = peg$parseTypeDeclaration();
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              s5 = peg$parseTypeDeclaration();
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parseEmptyLines();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseEOT();
                if (s6 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c0(s2, s3, s4);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsePackageDeclaration() {
      var s0, s1, s2, s3, s4, s5, s6;

      s0 = peg$currPos;
      s1 = peg$parseEmptyLines();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseLeadingComments();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseAnnotation();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parseAnnotation();
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parsePACKAGE();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseQualifiedIdentifier();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseSEMI();
                if (s6 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c1(s2, s3, s5);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseImportDeclaration() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      s0 = peg$currPos;
      s1 = peg$parseEmptyLines();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseIMPORT();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseSTATIC();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseQualifiedIdentifier();
            if (s4 !== peg$FAILED) {
              s5 = peg$currPos;
              s6 = peg$parseDOT();
              if (s6 !== peg$FAILED) {
                s7 = peg$parseSTAR();
                if (s7 !== peg$FAILED) {
                  s6 = [s6, s7];
                  s5 = s6;
                } else {
                  peg$currPos = s5;
                  s5 = peg$FAILED;
                }
              } else {
                peg$currPos = s5;
                s5 = peg$FAILED;
              }
              if (s5 === peg$FAILED) {
                s5 = null;
              }
              if (s5 !== peg$FAILED) {
                s6 = peg$parseSEMI();
                if (s6 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c2(s3, s4, s5);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseSEMI();
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c3();
        }
        s0 = s1;
      }

      return s0;
    }

    function peg$parseTypeDeclaration() {
      var s0, s1, s2, s3, s4, s5, s6;

      s0 = peg$currPos;
      s1 = peg$parseEmptyLines();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseLeadingComments();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseEmptyLines();
          if (s3 !== peg$FAILED) {
            s4 = [];
            s5 = peg$parseModifier();
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              s5 = peg$parseModifier();
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parseEmptyLines();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseClassDeclaration();
                if (s6 === peg$FAILED) {
                  s6 = peg$parseEnumDeclaration();
                  if (s6 === peg$FAILED) {
                    s6 = peg$parseInterfaceDeclaration();
                    if (s6 === peg$FAILED) {
                      s6 = peg$parseAnnotationTypeDeclaration();
                    }
                  }
                }
                if (s6 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c4(s2, s4, s6);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseSEMI();
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c3();
        }
        s0 = s1;
      }

      return s0;
    }

    function peg$parseClassDeclaration() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10;

      s0 = peg$currPos;
      s1 = peg$parseCLASS();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseIdentifier();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseEmptyLines();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseTypeParameters();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parseEmptyLines();
              if (s5 !== peg$FAILED) {
                s6 = peg$currPos;
                s7 = peg$parseEXTENDS();
                if (s7 !== peg$FAILED) {
                  s8 = peg$parseClassType();
                  if (s8 !== peg$FAILED) {
                    s7 = [s7, s8];
                    s6 = s7;
                  } else {
                    peg$currPos = s6;
                    s6 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s6;
                  s6 = peg$FAILED;
                }
                if (s6 === peg$FAILED) {
                  s6 = null;
                }
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseEmptyLines();
                  if (s7 !== peg$FAILED) {
                    s8 = peg$currPos;
                    s9 = peg$parseIMPLEMENTS();
                    if (s9 !== peg$FAILED) {
                      s10 = peg$parseClassTypeList();
                      if (s10 !== peg$FAILED) {
                        s9 = [s9, s10];
                        s8 = s9;
                      } else {
                        peg$currPos = s8;
                        s8 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s8;
                      s8 = peg$FAILED;
                    }
                    if (s8 === peg$FAILED) {
                      s8 = null;
                    }
                    if (s8 !== peg$FAILED) {
                      s9 = peg$parseEmptyLines();
                      if (s9 !== peg$FAILED) {
                        s10 = peg$parseClassBody();
                        if (s10 !== peg$FAILED) {
                          peg$savedPos = s0;
                          s1 = peg$c5(s2, s4, s6, s8, s10);
                          s0 = s1;
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseClassBody() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseLWING();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseClassBodyDeclaration();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseClassBodyDeclaration();
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseIndent();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseRWING();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c6(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseClassBodyDeclaration() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSEMI();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c3();
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseIndent();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseSTATIC();
          if (s2 === peg$FAILED) {
            s2 = null;
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parseBlock();
            if (s3 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c7(s2, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parseIndent();
          if (s1 !== peg$FAILED) {
            s2 = [];
            s3 = peg$parseModifier();
            while (s3 !== peg$FAILED) {
              s2.push(s3);
              s3 = peg$parseModifier();
            }
            if (s2 !== peg$FAILED) {
              s3 = peg$parseMemberDecl();
              if (s3 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c8(s2, s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parseIndent();
            if (s1 !== peg$FAILED) {
              s2 = peg$parseEndOfLineComment();
              if (s2 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c9(s2);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              s1 = peg$parseIndent();
              if (s1 !== peg$FAILED) {
                s2 = peg$parseTraditionalComment();
                if (s2 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c10(s2);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
              if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                s1 = peg$parseIndent();
                if (s1 !== peg$FAILED) {
                  s2 = peg$parseJavaDocComment();
                  if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c11(s2);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
                if (s0 === peg$FAILED) {
                  s0 = peg$currPos;
                  s1 = peg$parseIndent();
                  if (s1 !== peg$FAILED) {
                    s2 = peg$currPos;
                    peg$silentFails++;
                    s3 = peg$parseLetterOrDigit();
                    peg$silentFails--;
                    if (s3 === peg$FAILED) {
                      s2 = void 0;
                    } else {
                      peg$currPos = s2;
                      s2 = peg$FAILED;
                    }
                    if (s2 !== peg$FAILED) {
                      if (peg$c12.test(input.charAt(peg$currPos))) {
                        s3 = input.charAt(peg$currPos);
                        peg$currPos++;
                      } else {
                        s3 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c13); }
                      }
                      if (s3 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c14();
                        s0 = s1;
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parseMemberDecl() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseTypeParameters();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseGenericMethodOrConstructorRest();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c15(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseType();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseIdentifier();
          if (s2 !== peg$FAILED) {
            s3 = peg$parseMethodDeclaratorRest();
            if (s3 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c16(s1, s2, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parseType();
          if (s1 !== peg$FAILED) {
            s2 = peg$parseVariableDeclarators();
            if (s2 !== peg$FAILED) {
              s3 = peg$parseSEMI();
              if (s3 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c17(s1, s2);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parseVOID();
            if (s1 !== peg$FAILED) {
              s2 = peg$parseIdentifier();
              if (s2 !== peg$FAILED) {
                s3 = peg$parseVoidMethodDeclaratorRest();
                if (s3 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c18(s2, s3);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              s1 = peg$parseIdentifier();
              if (s1 !== peg$FAILED) {
                s2 = peg$parseConstructorDeclaratorRest();
                if (s2 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c19(s1, s2);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
              if (s0 === peg$FAILED) {
                s0 = peg$parseInterfaceDeclaration();
                if (s0 === peg$FAILED) {
                  s0 = peg$parseClassDeclaration();
                  if (s0 === peg$FAILED) {
                    s0 = peg$parseEnumDeclaration();
                    if (s0 === peg$FAILED) {
                      s0 = peg$parseAnnotationTypeDeclaration();
                    }
                  }
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parseGenericMethodOrConstructorRest() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseType();
      if (s1 === peg$FAILED) {
        s1 = peg$currPos;
        s2 = peg$parseVOID();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s1;
          s2 = peg$c20();
        }
        s1 = s2;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseIdentifier();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseMethodDeclaratorRest();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c21(s1, s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseIdentifier();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseConstructorDeclaratorRest();
          if (s2 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c22(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }

      return s0;
    }

    function peg$parseMethodDeclaratorRest() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseFormalParameters();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseDim();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseDim();
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          s4 = peg$parseTHROWS();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseClassTypeList();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseBlock();
            if (s4 === peg$FAILED) {
              s4 = peg$currPos;
              s5 = peg$parseSEMI();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s4;
                s5 = peg$c23(s1, s2, s3);
              }
              s4 = s5;
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c24(s1, s2, s3, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseVoidMethodDeclaratorRest() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseFormalParameters();
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        s3 = peg$parseTHROWS();
        if (s3 !== peg$FAILED) {
          s4 = peg$parseClassTypeList();
          if (s4 !== peg$FAILED) {
            s3 = [s3, s4];
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseBlock();
          if (s3 === peg$FAILED) {
            s3 = peg$currPos;
            s4 = peg$parseSEMI();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s3;
              s4 = peg$c25(s1, s2);
            }
            s3 = s4;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c26(s1, s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseConstructorDeclaratorRest() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseFormalParameters();
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        s3 = peg$parseTHROWS();
        if (s3 !== peg$FAILED) {
          s4 = peg$parseClassTypeList();
          if (s4 !== peg$FAILED) {
            s3 = [s3, s4];
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseBlock();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c27(s1, s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseInterfaceDeclaration() {
      var s0, s1, s2, s3, s4, s5, s6;

      s0 = peg$currPos;
      s1 = peg$parseINTERFACE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseIdentifier();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseTypeParameters();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$currPos;
            s5 = peg$parseEXTENDS();
            if (s5 !== peg$FAILED) {
              s6 = peg$parseClassTypeList();
              if (s6 !== peg$FAILED) {
                s5 = [s5, s6];
                s4 = s5;
              } else {
                peg$currPos = s4;
                s4 = peg$FAILED;
              }
            } else {
              peg$currPos = s4;
              s4 = peg$FAILED;
            }
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parseInterfaceBody();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c28(s2, s3, s4, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseInterfaceBody() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseLWING();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseInterfaceBodyDeclaration();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseInterfaceBodyDeclaration();
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseIndent();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseRWING();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c6(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseInterfaceBodyDeclaration() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseModifier();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseModifier();
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseInterfaceMemberDecl();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c8(s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseIndent();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseSEMI();
          if (s2 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c3();
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parseIndent();
          if (s1 !== peg$FAILED) {
            s2 = peg$parseEndOfLineComment();
            if (s2 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c9(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parseIndent();
            if (s1 !== peg$FAILED) {
              s2 = peg$parseTraditionalComment();
              if (s2 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c10(s2);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              s1 = peg$parseIndent();
              if (s1 !== peg$FAILED) {
                s2 = peg$parseJavaDocComment();
                if (s2 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c11(s2);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
              if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                s1 = peg$parseIndent();
                if (s1 !== peg$FAILED) {
                  s2 = peg$currPos;
                  peg$silentFails++;
                  s3 = peg$parseLetterOrDigit();
                  peg$silentFails--;
                  if (s3 === peg$FAILED) {
                    s2 = void 0;
                  } else {
                    peg$currPos = s2;
                    s2 = peg$FAILED;
                  }
                  if (s2 !== peg$FAILED) {
                    if (peg$c12.test(input.charAt(peg$currPos))) {
                      s3 = input.charAt(peg$currPos);
                      peg$currPos++;
                    } else {
                      s3 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c13); }
                    }
                    if (s3 !== peg$FAILED) {
                      peg$savedPos = s0;
                      s1 = peg$c14();
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parseInterfaceMemberDecl() {
      var s0, s1, s2, s3;

      s0 = peg$parseInterfaceMethodOrFieldDecl();
      if (s0 === peg$FAILED) {
        s0 = peg$parseInterfaceGenericMethodDecl();
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parseVOID();
          if (s1 !== peg$FAILED) {
            s2 = peg$parseIdentifier();
            if (s2 !== peg$FAILED) {
              s3 = peg$parseVoidInterfaceMethodDeclaratorRest();
              if (s3 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c22(s2, s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$parseInterfaceDeclaration();
            if (s0 === peg$FAILED) {
              s0 = peg$parseAnnotationTypeDeclaration();
              if (s0 === peg$FAILED) {
                s0 = peg$parseClassDeclaration();
                if (s0 === peg$FAILED) {
                  s0 = peg$parseEnumDeclaration();
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parseInterfaceMethodOrFieldDecl() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseType();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseIdentifier();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseInterfaceMethodOrFieldRest();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c29(s1, s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseInterfaceMethodOrFieldRest() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseConstantDeclaratorsRest();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSEMI();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c30(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$parseInterfaceMethodDeclaratorRest();
      }

      return s0;
    }

    function peg$parseInterfaceMethodDeclaratorRest() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseFormalParameters();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseDim();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseDim();
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          s4 = peg$parseTHROWS();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseClassTypeList();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSEMI();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c31(s1, s2, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseInterfaceGenericMethodDecl() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseTypeParameters();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseType();
        if (s2 === peg$FAILED) {
          s2 = peg$currPos;
          s3 = peg$parseVOID();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s2;
            s3 = peg$c32(s1);
          }
          s2 = s3;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseIdentifier();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseInterfaceMethodDeclaratorRest();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c33(s1, s2, s3, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseVoidInterfaceMethodDeclaratorRest() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseFormalParameters();
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        s3 = peg$parseTHROWS();
        if (s3 !== peg$FAILED) {
          s4 = peg$parseClassTypeList();
          if (s4 !== peg$FAILED) {
            s3 = [s3, s4];
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseSEMI();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c34(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseConstantDeclaratorsRest() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseConstantDeclaratorRest();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parseCOMMA();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseConstantDeclarator();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parseCOMMA();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseConstantDeclarator();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c35(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseConstantDeclarator() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseIdentifier();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseConstantDeclaratorRest();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c22(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseConstantDeclaratorRest() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parseDim();
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$parseDim();
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseEQU();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseVariableInitializer();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c36(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseEnumDeclaration() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseENUM();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseIdentifier();
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          s4 = peg$parseIMPLEMENTS();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseClassTypeList();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseEnumBody();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c37(s2, s3, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseEnumBody() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseLWING();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseEnumConstants();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseCOMMA();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseEnumBodyDeclarations();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parseRWING();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c38(s2, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseEnumConstants() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseEnumConstant();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parseCOMMA();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseEnumConstant();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parseCOMMA();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseEnumConstant();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c35(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseEnumConstant() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseEmptyLines();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseAnnotation();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseAnnotation();
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseIdentifier();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseArguments();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parseClassBody();
              if (s5 === peg$FAILED) {
                s5 = null;
              }
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c39(s2, s3, s4, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseEnumBodyDeclarations() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseSEMI();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseClassBodyDeclaration();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseClassBodyDeclaration();
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c40(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseLocalVariableDeclarationStatement() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parseFINAL();
        if (s4 !== peg$FAILED) {
          peg$savedPos = s3;
          s4 = peg$c41();
        }
        s3 = s4;
        if (s3 === peg$FAILED) {
          s3 = peg$parseAnnotation();
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parseFINAL();
          if (s4 !== peg$FAILED) {
            peg$savedPos = s3;
            s4 = peg$c41();
          }
          s3 = s4;
          if (s3 === peg$FAILED) {
            s3 = peg$parseAnnotation();
          }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseType();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseVariableDeclarators();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseSEMI();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c42(s2, s3, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseVariableDeclarators() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseVariableDeclarator();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parseCOMMA();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseVariableDeclarator();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parseCOMMA();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseVariableDeclarator();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c35(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseVariableDeclarator() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseIdentifier();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseDim();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseDim();
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          s4 = peg$parseEQU();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseVariableInitializer();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c43(s1, s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseFormalParameters() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseLPAR();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseFormalParameterList();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseEmptyLines();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseRPAR();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c44(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseFormalParameter() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$currPos;
      s3 = peg$parseFINAL();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s2;
        s3 = peg$c41();
      }
      s2 = s3;
      if (s2 === peg$FAILED) {
        s2 = peg$parseAnnotation();
      }
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$currPos;
        s3 = peg$parseFINAL();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s2;
          s3 = peg$c41();
        }
        s2 = s3;
        if (s2 === peg$FAILED) {
          s2 = peg$parseAnnotation();
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseType();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseVariableDeclaratorId();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c45(s1, s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseLastFormalParameter() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$currPos;
      s3 = peg$parseFINAL();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s2;
        s3 = peg$c41();
      }
      s2 = s3;
      if (s2 === peg$FAILED) {
        s2 = peg$parseAnnotation();
      }
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$currPos;
        s3 = peg$parseFINAL();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s2;
          s3 = peg$c41();
        }
        s2 = s3;
        if (s2 === peg$FAILED) {
          s2 = peg$parseAnnotation();
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseType();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseELLIPSIS();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseVariableDeclaratorId();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c46(s1, s2, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseFormalParameterList() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseFormalParameter();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parseCOMMA();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseFormalParameter();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parseCOMMA();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseFormalParameter();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          s4 = peg$parseCOMMA();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseLastFormalParameter();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c47(s1, s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseLastFormalParameter();
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c48(s1);
        }
        s0 = s1;
      }

      return s0;
    }

    function peg$parseVariableDeclaratorId() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseIdentifier();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseDim();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseDim();
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c49(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseBlock() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseLWING();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseBlockStatements();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseIndent();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseRWING();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c50(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseBlockStatements() {
      var s0, s1;

      s0 = [];
      s1 = peg$parseBlockStatement();
      while (s1 !== peg$FAILED) {
        s0.push(s1);
        s1 = peg$parseBlockStatement();
      }

      return s0;
    }

    function peg$parseBlockStatement() {
      var s0, s1, s2, s3;

      s0 = peg$parseLocalVariableDeclarationStatement();
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseIndent();
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parseModifier();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parseModifier();
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parseClassDeclaration();
            if (s3 === peg$FAILED) {
              s3 = peg$parseEnumDeclaration();
            }
            if (s3 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c51(s2, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$parseStatement();
        }
      }

      return s0;
    }

    function peg$parseStatement() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10;

      s0 = peg$parseBlock();
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseIndent();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseASSERT();
          if (s2 !== peg$FAILED) {
            s3 = peg$parseExpression();
            if (s3 !== peg$FAILED) {
              s4 = peg$currPos;
              s5 = peg$parseCOLON();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseExpression();
                if (s6 !== peg$FAILED) {
                  s5 = [s5, s6];
                  s4 = s5;
                } else {
                  peg$currPos = s4;
                  s4 = peg$FAILED;
                }
              } else {
                peg$currPos = s4;
                s4 = peg$FAILED;
              }
              if (s4 === peg$FAILED) {
                s4 = null;
              }
              if (s4 !== peg$FAILED) {
                s5 = peg$parseSEMI();
                if (s5 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c52(s3, s4);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parseIndent();
          if (s1 !== peg$FAILED) {
            s2 = peg$parseIF();
            if (s2 !== peg$FAILED) {
              s3 = peg$parseParExpression();
              if (s3 !== peg$FAILED) {
                s4 = peg$parseStatement();
                if (s4 !== peg$FAILED) {
                  s5 = peg$currPos;
                  s6 = peg$parseELSE();
                  if (s6 !== peg$FAILED) {
                    s7 = peg$parseStatement();
                    if (s7 !== peg$FAILED) {
                      s6 = [s6, s7];
                      s5 = s6;
                    } else {
                      peg$currPos = s5;
                      s5 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s5;
                    s5 = peg$FAILED;
                  }
                  if (s5 === peg$FAILED) {
                    s5 = null;
                  }
                  if (s5 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c53(s3, s4, s5);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parseIndent();
            if (s1 !== peg$FAILED) {
              s2 = peg$parseFOR();
              if (s2 !== peg$FAILED) {
                s3 = peg$parseLPAR();
                if (s3 !== peg$FAILED) {
                  s4 = peg$parseForInit();
                  if (s4 === peg$FAILED) {
                    s4 = null;
                  }
                  if (s4 !== peg$FAILED) {
                    s5 = peg$parseSEMI();
                    if (s5 !== peg$FAILED) {
                      s6 = peg$parseExpression();
                      if (s6 === peg$FAILED) {
                        s6 = null;
                      }
                      if (s6 !== peg$FAILED) {
                        s7 = peg$parseSEMI();
                        if (s7 !== peg$FAILED) {
                          s8 = peg$parseForUpdate();
                          if (s8 === peg$FAILED) {
                            s8 = null;
                          }
                          if (s8 !== peg$FAILED) {
                            s9 = peg$parseRPAR();
                            if (s9 !== peg$FAILED) {
                              s10 = peg$parseStatement();
                              if (s10 !== peg$FAILED) {
                                peg$savedPos = s0;
                                s1 = peg$c54(s4, s6, s8, s10);
                                s0 = s1;
                              } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                              }
                            } else {
                              peg$currPos = s0;
                              s0 = peg$FAILED;
                            }
                          } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              s1 = peg$parseIndent();
              if (s1 !== peg$FAILED) {
                s2 = peg$parseFOR();
                if (s2 !== peg$FAILED) {
                  s3 = peg$parseLPAR();
                  if (s3 !== peg$FAILED) {
                    s4 = peg$parseFormalParameter();
                    if (s4 !== peg$FAILED) {
                      s5 = peg$parseCOLON();
                      if (s5 !== peg$FAILED) {
                        s6 = peg$parseExpression();
                        if (s6 !== peg$FAILED) {
                          s7 = peg$parseRPAR();
                          if (s7 !== peg$FAILED) {
                            s8 = peg$parseStatement();
                            if (s8 !== peg$FAILED) {
                              peg$savedPos = s0;
                              s1 = peg$c55(s4, s6, s8);
                              s0 = s1;
                            } else {
                              peg$currPos = s0;
                              s0 = peg$FAILED;
                            }
                          } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
              if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                s1 = peg$parseIndent();
                if (s1 !== peg$FAILED) {
                  s2 = peg$parseWHILE();
                  if (s2 !== peg$FAILED) {
                    s3 = peg$parseParExpression();
                    if (s3 !== peg$FAILED) {
                      s4 = peg$parseStatement();
                      if (s4 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c56(s3, s4);
                        s0 = s1;
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
                if (s0 === peg$FAILED) {
                  s0 = peg$currPos;
                  s1 = peg$parseIndent();
                  if (s1 !== peg$FAILED) {
                    s2 = peg$parseDO();
                    if (s2 !== peg$FAILED) {
                      s3 = peg$parseStatement();
                      if (s3 !== peg$FAILED) {
                        s4 = peg$parseWHILE();
                        if (s4 !== peg$FAILED) {
                          s5 = peg$parseParExpression();
                          if (s5 !== peg$FAILED) {
                            s6 = peg$parseSEMI();
                            if (s6 !== peg$FAILED) {
                              peg$savedPos = s0;
                              s1 = peg$c57(s3, s5);
                              s0 = s1;
                            } else {
                              peg$currPos = s0;
                              s0 = peg$FAILED;
                            }
                          } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                  if (s0 === peg$FAILED) {
                    s0 = peg$currPos;
                    s1 = peg$parseIndent();
                    if (s1 !== peg$FAILED) {
                      s2 = peg$parseTRY();
                      if (s2 !== peg$FAILED) {
                        s3 = peg$parseLPAR();
                        if (s3 !== peg$FAILED) {
                          s4 = peg$parseResource();
                          if (s4 !== peg$FAILED) {
                            s5 = [];
                            s6 = peg$currPos;
                            s7 = peg$parseSEMI();
                            if (s7 !== peg$FAILED) {
                              s8 = peg$parseResource();
                              if (s8 !== peg$FAILED) {
                                s7 = [s7, s8];
                                s6 = s7;
                              } else {
                                peg$currPos = s6;
                                s6 = peg$FAILED;
                              }
                            } else {
                              peg$currPos = s6;
                              s6 = peg$FAILED;
                            }
                            while (s6 !== peg$FAILED) {
                              s5.push(s6);
                              s6 = peg$currPos;
                              s7 = peg$parseSEMI();
                              if (s7 !== peg$FAILED) {
                                s8 = peg$parseResource();
                                if (s8 !== peg$FAILED) {
                                  s7 = [s7, s8];
                                  s6 = s7;
                                } else {
                                  peg$currPos = s6;
                                  s6 = peg$FAILED;
                                }
                              } else {
                                peg$currPos = s6;
                                s6 = peg$FAILED;
                              }
                            }
                            if (s5 !== peg$FAILED) {
                              s6 = peg$parseSEMI();
                              if (s6 === peg$FAILED) {
                                s6 = null;
                              }
                              if (s6 !== peg$FAILED) {
                                s7 = peg$parseRPAR();
                                if (s7 !== peg$FAILED) {
                                  s8 = peg$parseBlock();
                                  if (s8 !== peg$FAILED) {
                                    s9 = [];
                                    s10 = peg$parseCatch();
                                    while (s10 !== peg$FAILED) {
                                      s9.push(s10);
                                      s10 = peg$parseCatch();
                                    }
                                    if (s9 !== peg$FAILED) {
                                      s10 = peg$parseFinally();
                                      if (s10 === peg$FAILED) {
                                        s10 = null;
                                      }
                                      if (s10 !== peg$FAILED) {
                                        peg$savedPos = s0;
                                        s1 = peg$c58(s4, s5, s8, s9, s10);
                                        s0 = s1;
                                      } else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                      }
                                    } else {
                                      peg$currPos = s0;
                                      s0 = peg$FAILED;
                                    }
                                  } else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                  }
                                } else {
                                  peg$currPos = s0;
                                  s0 = peg$FAILED;
                                }
                              } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                              }
                            } else {
                              peg$currPos = s0;
                              s0 = peg$FAILED;
                            }
                          } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                    if (s0 === peg$FAILED) {
                      s0 = peg$currPos;
                      s1 = peg$parseIndent();
                      if (s1 !== peg$FAILED) {
                        s2 = peg$parseTRY();
                        if (s2 !== peg$FAILED) {
                          s3 = peg$parseBlock();
                          if (s3 !== peg$FAILED) {
                            s4 = peg$currPos;
                            s5 = [];
                            s6 = peg$parseCatch();
                            if (s6 !== peg$FAILED) {
                              while (s6 !== peg$FAILED) {
                                s5.push(s6);
                                s6 = peg$parseCatch();
                              }
                            } else {
                              s5 = peg$FAILED;
                            }
                            if (s5 !== peg$FAILED) {
                              s6 = peg$parseFinally();
                              if (s6 === peg$FAILED) {
                                s6 = null;
                              }
                              if (s6 !== peg$FAILED) {
                                peg$savedPos = s4;
                                s5 = peg$c59(s3, s5, s6);
                                s4 = s5;
                              } else {
                                peg$currPos = s4;
                                s4 = peg$FAILED;
                              }
                            } else {
                              peg$currPos = s4;
                              s4 = peg$FAILED;
                            }
                            if (s4 === peg$FAILED) {
                              s4 = peg$currPos;
                              s5 = peg$parseFinally();
                              if (s5 !== peg$FAILED) {
                                peg$savedPos = s4;
                                s5 = peg$c60(s3, s5);
                              }
                              s4 = s5;
                            }
                            if (s4 !== peg$FAILED) {
                              peg$savedPos = s0;
                              s1 = peg$c61(s3, s4);
                              s0 = s1;
                            } else {
                              peg$currPos = s0;
                              s0 = peg$FAILED;
                            }
                          } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                      if (s0 === peg$FAILED) {
                        s0 = peg$currPos;
                        s1 = peg$parseIndent();
                        if (s1 !== peg$FAILED) {
                          s2 = peg$parseSWITCH();
                          if (s2 !== peg$FAILED) {
                            s3 = peg$parseParExpression();
                            if (s3 !== peg$FAILED) {
                              s4 = peg$parseLWING();
                              if (s4 !== peg$FAILED) {
                                s5 = peg$parseSwitchBlockStatementGroups();
                                if (s5 !== peg$FAILED) {
                                  s6 = peg$parseRWING();
                                  if (s6 !== peg$FAILED) {
                                    peg$savedPos = s0;
                                    s1 = peg$c62(s3, s5);
                                    s0 = s1;
                                  } else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                  }
                                } else {
                                  peg$currPos = s0;
                                  s0 = peg$FAILED;
                                }
                              } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                              }
                            } else {
                              peg$currPos = s0;
                              s0 = peg$FAILED;
                            }
                          } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                        if (s0 === peg$FAILED) {
                          s0 = peg$currPos;
                          s1 = peg$parseIndent();
                          if (s1 !== peg$FAILED) {
                            s2 = peg$parseSYNCHRONIZED();
                            if (s2 !== peg$FAILED) {
                              s3 = peg$parseParExpression();
                              if (s3 !== peg$FAILED) {
                                s4 = peg$parseBlock();
                                if (s4 !== peg$FAILED) {
                                  peg$savedPos = s0;
                                  s1 = peg$c63(s3, s4);
                                  s0 = s1;
                                } else {
                                  peg$currPos = s0;
                                  s0 = peg$FAILED;
                                }
                              } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                              }
                            } else {
                              peg$currPos = s0;
                              s0 = peg$FAILED;
                            }
                          } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                          }
                          if (s0 === peg$FAILED) {
                            s0 = peg$currPos;
                            s1 = peg$parseIndent();
                            if (s1 !== peg$FAILED) {
                              s2 = peg$parseRETURN();
                              if (s2 !== peg$FAILED) {
                                s3 = peg$parseExpression();
                                if (s3 === peg$FAILED) {
                                  s3 = null;
                                }
                                if (s3 !== peg$FAILED) {
                                  s4 = peg$parseSEMI();
                                  if (s4 !== peg$FAILED) {
                                    peg$savedPos = s0;
                                    s1 = peg$c64(s3);
                                    s0 = s1;
                                  } else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                  }
                                } else {
                                  peg$currPos = s0;
                                  s0 = peg$FAILED;
                                }
                              } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                              }
                            } else {
                              peg$currPos = s0;
                              s0 = peg$FAILED;
                            }
                            if (s0 === peg$FAILED) {
                              s0 = peg$currPos;
                              s1 = peg$parseIndent();
                              if (s1 !== peg$FAILED) {
                                s2 = peg$parseTHROW();
                                if (s2 !== peg$FAILED) {
                                  s3 = peg$parseExpression();
                                  if (s3 !== peg$FAILED) {
                                    s4 = peg$parseSEMI();
                                    if (s4 !== peg$FAILED) {
                                      peg$savedPos = s0;
                                      s1 = peg$c65(s3);
                                      s0 = s1;
                                    } else {
                                      peg$currPos = s0;
                                      s0 = peg$FAILED;
                                    }
                                  } else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                  }
                                } else {
                                  peg$currPos = s0;
                                  s0 = peg$FAILED;
                                }
                              } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                              }
                              if (s0 === peg$FAILED) {
                                s0 = peg$currPos;
                                s1 = peg$parseIndent();
                                if (s1 !== peg$FAILED) {
                                  s2 = peg$parseBREAK();
                                  if (s2 !== peg$FAILED) {
                                    s3 = peg$parseIdentifier();
                                    if (s3 === peg$FAILED) {
                                      s3 = null;
                                    }
                                    if (s3 !== peg$FAILED) {
                                      s4 = peg$parseSEMI();
                                      if (s4 !== peg$FAILED) {
                                        peg$savedPos = s0;
                                        s1 = peg$c66(s3);
                                        s0 = s1;
                                      } else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                      }
                                    } else {
                                      peg$currPos = s0;
                                      s0 = peg$FAILED;
                                    }
                                  } else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                  }
                                } else {
                                  peg$currPos = s0;
                                  s0 = peg$FAILED;
                                }
                                if (s0 === peg$FAILED) {
                                  s0 = peg$currPos;
                                  s1 = peg$parseIndent();
                                  if (s1 !== peg$FAILED) {
                                    s2 = peg$parseCONTINUE();
                                    if (s2 !== peg$FAILED) {
                                      s3 = peg$parseIdentifier();
                                      if (s3 === peg$FAILED) {
                                        s3 = null;
                                      }
                                      if (s3 !== peg$FAILED) {
                                        s4 = peg$parseSEMI();
                                        if (s4 !== peg$FAILED) {
                                          peg$savedPos = s0;
                                          s1 = peg$c67(s3);
                                          s0 = s1;
                                        } else {
                                          peg$currPos = s0;
                                          s0 = peg$FAILED;
                                        }
                                      } else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                      }
                                    } else {
                                      peg$currPos = s0;
                                      s0 = peg$FAILED;
                                    }
                                  } else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                  }
                                  if (s0 === peg$FAILED) {
                                    s0 = peg$currPos;
                                    s1 = peg$parseIndent();
                                    if (s1 !== peg$FAILED) {
                                      s2 = peg$parseSEMI();
                                      if (s2 !== peg$FAILED) {
                                        peg$savedPos = s0;
                                        s1 = peg$c68();
                                        s0 = s1;
                                      } else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                      }
                                    } else {
                                      peg$currPos = s0;
                                      s0 = peg$FAILED;
                                    }
                                    if (s0 === peg$FAILED) {
                                      s0 = peg$currPos;
                                      s1 = peg$parseIndent();
                                      if (s1 !== peg$FAILED) {
                                        s2 = peg$parseStatementExpression();
                                        if (s2 !== peg$FAILED) {
                                          s3 = peg$parseSEMI();
                                          if (s3 !== peg$FAILED) {
                                            peg$savedPos = s0;
                                            s1 = peg$c69(s2);
                                            s0 = s1;
                                          } else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                          }
                                        } else {
                                          peg$currPos = s0;
                                          s0 = peg$FAILED;
                                        }
                                      } else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                      }
                                      if (s0 === peg$FAILED) {
                                        s0 = peg$currPos;
                                        s1 = peg$parseIndent();
                                        if (s1 !== peg$FAILED) {
                                          s2 = peg$parseIdentifier();
                                          if (s2 !== peg$FAILED) {
                                            s3 = peg$parseCOLON();
                                            if (s3 !== peg$FAILED) {
                                              s4 = peg$parseStatement();
                                              if (s4 !== peg$FAILED) {
                                                peg$savedPos = s0;
                                                s1 = peg$c70(s2, s4);
                                                s0 = s1;
                                              } else {
                                                peg$currPos = s0;
                                                s0 = peg$FAILED;
                                              }
                                            } else {
                                              peg$currPos = s0;
                                              s0 = peg$FAILED;
                                            }
                                          } else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                          }
                                        } else {
                                          peg$currPos = s0;
                                          s0 = peg$FAILED;
                                        }
                                        if (s0 === peg$FAILED) {
                                          s0 = peg$currPos;
                                          s1 = peg$parseIndent();
                                          if (s1 !== peg$FAILED) {
                                            s2 = peg$parseEndOfLineComment();
                                            if (s2 !== peg$FAILED) {
                                              peg$savedPos = s0;
                                              s1 = peg$c9(s2);
                                              s0 = s1;
                                            } else {
                                              peg$currPos = s0;
                                              s0 = peg$FAILED;
                                            }
                                          } else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                          }
                                          if (s0 === peg$FAILED) {
                                            s0 = peg$currPos;
                                            s1 = peg$parseIndent();
                                            if (s1 !== peg$FAILED) {
                                              s2 = peg$parseTraditionalComment();
                                              if (s2 !== peg$FAILED) {
                                                peg$savedPos = s0;
                                                s1 = peg$c10(s2);
                                                s0 = s1;
                                              } else {
                                                peg$currPos = s0;
                                                s0 = peg$FAILED;
                                              }
                                            } else {
                                              peg$currPos = s0;
                                              s0 = peg$FAILED;
                                            }
                                            if (s0 === peg$FAILED) {
                                              s0 = peg$currPos;
                                              s1 = peg$parseIndent();
                                              if (s1 !== peg$FAILED) {
                                                s2 = peg$parseJavaDocComment();
                                                if (s2 !== peg$FAILED) {
                                                  peg$savedPos = s0;
                                                  s1 = peg$c11(s2);
                                                  s0 = s1;
                                                } else {
                                                  peg$currPos = s0;
                                                  s0 = peg$FAILED;
                                                }
                                              } else {
                                                peg$currPos = s0;
                                                s0 = peg$FAILED;
                                              }
                                              if (s0 === peg$FAILED) {
                                                s0 = peg$currPos;
                                                s1 = peg$parseIndent();
                                                if (s1 !== peg$FAILED) {
                                                  s2 = peg$currPos;
                                                  peg$silentFails++;
                                                  s3 = peg$parseLetterOrDigit();
                                                  peg$silentFails--;
                                                  if (s3 === peg$FAILED) {
                                                    s2 = void 0;
                                                  } else {
                                                    peg$currPos = s2;
                                                    s2 = peg$FAILED;
                                                  }
                                                  if (s2 !== peg$FAILED) {
                                                    if (peg$c12.test(input.charAt(peg$currPos))) {
                                                      s3 = input.charAt(peg$currPos);
                                                      peg$currPos++;
                                                    } else {
                                                      s3 = peg$FAILED;
                                                      if (peg$silentFails === 0) { peg$fail(peg$c13); }
                                                    }
                                                    if (s3 !== peg$FAILED) {
                                                      peg$savedPos = s0;
                                                      s1 = peg$c14();
                                                      s0 = s1;
                                                    } else {
                                                      peg$currPos = s0;
                                                      s0 = peg$FAILED;
                                                    }
                                                  } else {
                                                    peg$currPos = s0;
                                                    s0 = peg$FAILED;
                                                  }
                                                } else {
                                                  peg$currPos = s0;
                                                  s0 = peg$FAILED;
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parseResource() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$currPos;
      s3 = peg$parseFINAL();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s2;
        s3 = peg$c41();
      }
      s2 = s3;
      if (s2 === peg$FAILED) {
        s2 = peg$parseAnnotation();
      }
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$currPos;
        s3 = peg$parseFINAL();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s2;
          s3 = peg$c41();
        }
        s2 = s3;
        if (s2 === peg$FAILED) {
          s2 = peg$parseAnnotation();
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseType();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseVariableDeclaratorId();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseEQU();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseExpression();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c71(s1, s2, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseCatch() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

      s0 = peg$currPos;
      s1 = peg$parseCATCH();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseLPAR();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$currPos;
          s5 = peg$parseFINAL();
          if (s5 !== peg$FAILED) {
            peg$savedPos = s4;
            s5 = peg$c41();
          }
          s4 = s5;
          if (s4 === peg$FAILED) {
            s4 = peg$parseAnnotation();
          }
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$currPos;
            s5 = peg$parseFINAL();
            if (s5 !== peg$FAILED) {
              peg$savedPos = s4;
              s5 = peg$c41();
            }
            s4 = s5;
            if (s4 === peg$FAILED) {
              s4 = peg$parseAnnotation();
            }
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseType();
            if (s4 !== peg$FAILED) {
              s5 = [];
              s6 = peg$currPos;
              s7 = peg$parseOR();
              if (s7 !== peg$FAILED) {
                s8 = peg$parseType();
                if (s8 !== peg$FAILED) {
                  s7 = [s7, s8];
                  s6 = s7;
                } else {
                  peg$currPos = s6;
                  s6 = peg$FAILED;
                }
              } else {
                peg$currPos = s6;
                s6 = peg$FAILED;
              }
              while (s6 !== peg$FAILED) {
                s5.push(s6);
                s6 = peg$currPos;
                s7 = peg$parseOR();
                if (s7 !== peg$FAILED) {
                  s8 = peg$parseType();
                  if (s8 !== peg$FAILED) {
                    s7 = [s7, s8];
                    s6 = s7;
                  } else {
                    peg$currPos = s6;
                    s6 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s6;
                  s6 = peg$FAILED;
                }
              }
              if (s5 !== peg$FAILED) {
                s6 = peg$parseVariableDeclaratorId();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseEmptyLines();
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parseRPAR();
                    if (s8 !== peg$FAILED) {
                      s9 = peg$parseBlock();
                      if (s9 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c72(s3, s4, s5, s6, s9);
                        s0 = s1;
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseFinally() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseFINALLY();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseBlock();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c73(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseSwitchBlockStatementGroups() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parseSwitchBlockStatementGroup();
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$parseSwitchBlockStatementGroup();
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c74(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseSwitchBlockStatementGroup() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseSwitchLabel();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseBlockStatements();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c75(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseSwitchLabel() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseCASE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseExpression();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseCOLON();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c76(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseCASE();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseIdentifier();
          if (s2 !== peg$FAILED) {
            s3 = peg$parseCOLON();
            if (s3 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c76(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parseDEFAULT();
          if (s1 !== peg$FAILED) {
            s2 = peg$parseCOLON();
            if (s2 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c3();
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        }
      }

      return s0;
    }

    function peg$parseForInit() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$currPos;
      s3 = peg$parseFINAL();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s2;
        s3 = peg$c41();
      }
      s2 = s3;
      if (s2 === peg$FAILED) {
        s2 = peg$parseAnnotation();
      }
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$currPos;
        s3 = peg$parseFINAL();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s2;
          s3 = peg$c41();
        }
        s2 = s3;
        if (s2 === peg$FAILED) {
          s2 = peg$parseAnnotation();
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseType();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseVariableDeclarators();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c77(s1, s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseStatementExpression();
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$currPos;
          s4 = peg$parseCOMMA();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseStatementExpression();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$currPos;
            s4 = peg$parseCOMMA();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseStatementExpression();
              if (s5 !== peg$FAILED) {
                s4 = [s4, s5];
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          }
          if (s2 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c78(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }

      return s0;
    }

    function peg$parseForUpdate() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseStatementExpression();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parseCOMMA();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseStatementExpression();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parseCOMMA();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseStatementExpression();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c78(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseStatementExpression() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parseExpression();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c79(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseExpression() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseConditionalExpression();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseAssignmentOperator();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseExpression();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c80(s1, s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseIdentifier();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseCOLONCOLON();
          if (s2 !== peg$FAILED) {
            s3 = peg$parseIdentifier();
            if (s3 === peg$FAILED) {
              s3 = peg$currPos;
              s4 = peg$parseNEW();
              if (s4 !== peg$FAILED) {
                peg$savedPos = s3;
                s4 = peg$c81(s1);
              }
              s3 = s4;
            }
            if (s3 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c82(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$parseLambdaExpression();
          if (s0 === peg$FAILED) {
            s0 = peg$parseConditionalExpression();
          }
        }
      }

      return s0;
    }

    function peg$parseLambdaExpression() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseArguments();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsePOINTER();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseLambdaBody();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c83(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseIdentifier();
        if (s1 !== peg$FAILED) {
          s2 = peg$parsePOINTER();
          if (s2 !== peg$FAILED) {
            s3 = peg$parseLambdaBody();
            if (s3 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c84(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }

      return s0;
    }

    function peg$parseLambdaBody() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parseBlock();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c85(s1);
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseStatementExpression();
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c86(s1);
        }
        s0 = s1;
      }

      return s0;
    }

    function peg$parseAssignmentOperator() {
      var s0;

      s0 = peg$parseEQU();
      if (s0 === peg$FAILED) {
        s0 = peg$parsePLUSEQU();
        if (s0 === peg$FAILED) {
          s0 = peg$parseMINUSEQU();
          if (s0 === peg$FAILED) {
            s0 = peg$parseSTAREQU();
            if (s0 === peg$FAILED) {
              s0 = peg$parseDIVEQU();
              if (s0 === peg$FAILED) {
                s0 = peg$parseANDEQU();
                if (s0 === peg$FAILED) {
                  s0 = peg$parseOREQU();
                  if (s0 === peg$FAILED) {
                    s0 = peg$parseHATEQU();
                    if (s0 === peg$FAILED) {
                      s0 = peg$parseMODEQU();
                      if (s0 === peg$FAILED) {
                        s0 = peg$parseSLEQU();
                        if (s0 === peg$FAILED) {
                          s0 = peg$parseSREQU();
                          if (s0 === peg$FAILED) {
                            s0 = peg$parseBSREQU();
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parseConditionalExpression() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseConditionalOrExpression();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseQUERY();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseExpression();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseCOLON();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseConditionalExpression();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c87(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$parseConditionalOrExpression();
      }

      return s0;
    }

    function peg$parseConditionalOrExpression() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseConditionalAndExpression();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parseOROR();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseConditionalAndExpression();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parseOROR();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseConditionalAndExpression();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c88(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseConditionalAndExpression() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseInclusiveOrExpression();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parseANDAND();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseInclusiveOrExpression();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parseANDAND();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseInclusiveOrExpression();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c88(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseInclusiveOrExpression() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseExclusiveOrExpression();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parseOR();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseExclusiveOrExpression();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parseOR();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseExclusiveOrExpression();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c88(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseExclusiveOrExpression() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseAndExpression();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parseHAT();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseAndExpression();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parseHAT();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseAndExpression();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c88(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseAndExpression() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseEqualityExpression();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parseAND();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseEqualityExpression();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parseAND();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseEqualityExpression();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c88(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseEqualityExpression() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseRelationalExpression();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parseEQUAL();
        if (s4 === peg$FAILED) {
          s4 = peg$parseNOTEQUAL();
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parseRelationalExpression();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parseEQUAL();
          if (s4 === peg$FAILED) {
            s4 = peg$parseNOTEQUAL();
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parseRelationalExpression();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c88(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseRelationalExpression() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseShiftExpression();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parseLE();
        if (s4 === peg$FAILED) {
          s4 = peg$parseGE();
          if (s4 === peg$FAILED) {
            s4 = peg$parseLT();
            if (s4 === peg$FAILED) {
              s4 = peg$parseGT();
            }
          }
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parseShiftExpression();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        if (s3 === peg$FAILED) {
          s3 = peg$currPos;
          s4 = peg$parseINSTANCEOF();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseReferenceType();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parseLE();
          if (s4 === peg$FAILED) {
            s4 = peg$parseGE();
            if (s4 === peg$FAILED) {
              s4 = peg$parseLT();
              if (s4 === peg$FAILED) {
                s4 = peg$parseGT();
              }
            }
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parseShiftExpression();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 === peg$FAILED) {
            s3 = peg$currPos;
            s4 = peg$parseINSTANCEOF();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseReferenceType();
              if (s5 !== peg$FAILED) {
                s4 = [s4, s5];
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c89(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseShiftExpression() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseAdditiveExpression();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parseSL();
        if (s4 === peg$FAILED) {
          s4 = peg$parseSR();
          if (s4 === peg$FAILED) {
            s4 = peg$parseBSR();
          }
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parseAdditiveExpression();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parseSL();
          if (s4 === peg$FAILED) {
            s4 = peg$parseSR();
            if (s4 === peg$FAILED) {
              s4 = peg$parseBSR();
            }
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parseAdditiveExpression();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c88(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseAdditiveExpression() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseMultiplicativeExpression();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parsePLUS();
        if (s4 === peg$FAILED) {
          s4 = peg$parseMINUS();
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parseMultiplicativeExpression();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parsePLUS();
          if (s4 === peg$FAILED) {
            s4 = peg$parseMINUS();
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parseMultiplicativeExpression();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c88(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseMultiplicativeExpression() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseUnaryExpression();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parseSTAR();
        if (s4 === peg$FAILED) {
          s4 = peg$parseDIV();
          if (s4 === peg$FAILED) {
            s4 = peg$parseMOD();
          }
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parseUnaryExpression();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parseSTAR();
          if (s4 === peg$FAILED) {
            s4 = peg$parseDIV();
            if (s4 === peg$FAILED) {
              s4 = peg$parseMOD();
            }
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parseUnaryExpression();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c88(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseUnaryExpression() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parsePrefixOp();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseUnaryExpression();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c90(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$parseUnaryExpressionNotPlusMinus();
      }

      return s0;
    }

    function peg$parseUnaryExpressionNotPlusMinus() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseCastExpression();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c91(s1);
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parsePrimary();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseSelector();
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parseSelector();
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parseSelector();
            }
            if (s3 !== peg$FAILED) {
              s4 = [];
              s5 = peg$parsePostfixOp();
              if (s5 !== peg$FAILED) {
                while (s5 !== peg$FAILED) {
                  s4.push(s5);
                  s5 = peg$parsePostfixOp();
                }
              } else {
                s4 = peg$FAILED;
              }
              if (s4 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c92(s1, s2, s3, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parsePrimary();
          if (s1 !== peg$FAILED) {
            s2 = peg$parseSelector();
            if (s2 !== peg$FAILED) {
              s3 = [];
              s4 = peg$parseSelector();
              while (s4 !== peg$FAILED) {
                s3.push(s4);
                s4 = peg$parseSelector();
              }
              if (s3 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c93(s1, s2, s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parsePrimary();
            if (s1 !== peg$FAILED) {
              s2 = [];
              s3 = peg$parsePostfixOp();
              if (s3 !== peg$FAILED) {
                while (s3 !== peg$FAILED) {
                  s2.push(s3);
                  s3 = peg$parsePostfixOp();
                }
              } else {
                s2 = peg$FAILED;
              }
              if (s2 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c94(s1, s2);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
              s0 = peg$parsePrimary();
            }
          }
        }
      }

      return s0;
    }

    function peg$parseCastExpression() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseLPAR();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseBasicType();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseRPAR();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseUnaryExpression();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseLPAR();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseReferenceType();
          if (s2 !== peg$FAILED) {
            s3 = peg$parseRPAR();
            if (s3 !== peg$FAILED) {
              s4 = peg$parseUnaryExpressionNotPlusMinus();
              if (s4 !== peg$FAILED) {
                s1 = [s1, s2, s3, s4];
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }

      return s0;
    }

    function peg$parsePrimary() {
      var s0, s1, s2, s3, s4;

      s0 = peg$parseParExpression();
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseNonWildcardTypeArguments();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseExplicitGenericInvocationSuffix();
          if (s2 === peg$FAILED) {
            s2 = peg$currPos;
            s3 = peg$parseTHIS();
            if (s3 !== peg$FAILED) {
              s4 = peg$parseArguments();
              if (s4 !== peg$FAILED) {
                peg$savedPos = s2;
                s3 = peg$c95(s1, s4);
                s2 = s3;
              } else {
                peg$currPos = s2;
                s2 = peg$FAILED;
              }
            } else {
              peg$currPos = s2;
              s2 = peg$FAILED;
            }
          }
          if (s2 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c96(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parseTHIS();
          if (s1 !== peg$FAILED) {
            s2 = peg$parseArguments();
            if (s2 === peg$FAILED) {
              s2 = null;
            }
            if (s2 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c97(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parseSUPER();
            if (s1 !== peg$FAILED) {
              s2 = peg$parseSuperSuffix();
              if (s2 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c98(s2);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
              s0 = peg$parseLiteral();
              if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                s1 = peg$parseNEW();
                if (s1 !== peg$FAILED) {
                  s2 = peg$parseCreator();
                  if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c99(s2);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
                if (s0 === peg$FAILED) {
                  s0 = peg$parseQualifiedIdentifierSuffix();
                  if (s0 === peg$FAILED) {
                    s0 = peg$parseQualifiedIdentifier();
                    if (s0 === peg$FAILED) {
                      s0 = peg$currPos;
                      s1 = peg$parseBasicType();
                      if (s1 !== peg$FAILED) {
                        s2 = [];
                        s3 = peg$parseDim();
                        while (s3 !== peg$FAILED) {
                          s2.push(s3);
                          s3 = peg$parseDim();
                        }
                        if (s2 !== peg$FAILED) {
                          s3 = peg$parseDOT();
                          if (s3 !== peg$FAILED) {
                            s4 = peg$parseCLASS();
                            if (s4 !== peg$FAILED) {
                              peg$savedPos = s0;
                              s1 = peg$c100(s1, s2);
                              s0 = s1;
                            } else {
                              peg$currPos = s0;
                              s0 = peg$FAILED;
                            }
                          } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                      if (s0 === peg$FAILED) {
                        s0 = peg$currPos;
                        s1 = peg$parseVOID();
                        if (s1 !== peg$FAILED) {
                          s2 = peg$parseDOT();
                          if (s2 !== peg$FAILED) {
                            s3 = peg$parseCLASS();
                            if (s3 !== peg$FAILED) {
                              peg$savedPos = s0;
                              s1 = peg$c101();
                              s0 = s1;
                            } else {
                              peg$currPos = s0;
                              s0 = peg$FAILED;
                            }
                          } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parseQualifiedIdentifierSuffix() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseQualifiedIdentifier();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseDim();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parseDim();
          }
        } else {
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseDOT();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseCLASS();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c102(s1, s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseQualifiedIdentifier();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseLBRK();
          if (s2 !== peg$FAILED) {
            s3 = peg$parseExpression();
            if (s3 !== peg$FAILED) {
              s4 = peg$parseRBRK();
              if (s4 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c103(s1, s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parseQualifiedIdentifier();
          if (s1 !== peg$FAILED) {
            s2 = peg$parseArguments();
            if (s2 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c104(s1, s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parseQualifiedIdentifier();
            if (s1 !== peg$FAILED) {
              s2 = peg$parseDOT();
              if (s2 !== peg$FAILED) {
                s3 = peg$parseCLASS();
                if (s3 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c105(s1);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              s1 = peg$parseQualifiedIdentifier();
              if (s1 !== peg$FAILED) {
                s2 = peg$parseDOT();
                if (s2 !== peg$FAILED) {
                  s3 = peg$parseExplicitGenericInvocation();
                  if (s3 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c106(s1, s3);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
              if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                s1 = peg$parseQualifiedIdentifier();
                if (s1 !== peg$FAILED) {
                  s2 = peg$parseDOT();
                  if (s2 !== peg$FAILED) {
                    s3 = peg$parseTHIS();
                    if (s3 !== peg$FAILED) {
                      peg$savedPos = s0;
                      s1 = peg$c107(s1);
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
                if (s0 === peg$FAILED) {
                  s0 = peg$currPos;
                  s1 = peg$parseQualifiedIdentifier();
                  if (s1 !== peg$FAILED) {
                    s2 = peg$parseDOT();
                    if (s2 !== peg$FAILED) {
                      s3 = peg$parseSUPER();
                      if (s3 !== peg$FAILED) {
                        s4 = peg$parseArguments();
                        if (s4 !== peg$FAILED) {
                          peg$savedPos = s0;
                          s1 = peg$c108(s1, s4);
                          s0 = s1;
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                  if (s0 === peg$FAILED) {
                    s0 = peg$currPos;
                    s1 = peg$parseQualifiedIdentifier();
                    if (s1 !== peg$FAILED) {
                      s2 = peg$parseDOT();
                      if (s2 !== peg$FAILED) {
                        s3 = peg$parseNEW();
                        if (s3 !== peg$FAILED) {
                          s4 = peg$parseNonWildcardTypeArguments();
                          if (s4 === peg$FAILED) {
                            s4 = null;
                          }
                          if (s4 !== peg$FAILED) {
                            s5 = peg$parseInnerCreator();
                            if (s5 !== peg$FAILED) {
                              peg$savedPos = s0;
                              s1 = peg$c109(s1, s4, s5);
                              s0 = s1;
                            } else {
                              peg$currPos = s0;
                              s0 = peg$FAILED;
                            }
                          } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  }
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parseExplicitGenericInvocation() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseNonWildcardTypeArguments();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseExplicitGenericInvocationSuffix();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c96(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseNonWildcardTypeArguments() {
      var s0, s1, s2, s3, s4, s5, s6;

      s0 = peg$currPos;
      s1 = peg$parseLPOINT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseReferenceType();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$currPos;
          s5 = peg$parseCOMMA();
          if (s5 !== peg$FAILED) {
            s6 = peg$parseReferenceType();
            if (s6 !== peg$FAILED) {
              s5 = [s5, s6];
              s4 = s5;
            } else {
              peg$currPos = s4;
              s4 = peg$FAILED;
            }
          } else {
            peg$currPos = s4;
            s4 = peg$FAILED;
          }
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$currPos;
            s5 = peg$parseCOMMA();
            if (s5 !== peg$FAILED) {
              s6 = peg$parseReferenceType();
              if (s6 !== peg$FAILED) {
                s5 = [s5, s6];
                s4 = s5;
              } else {
                peg$currPos = s4;
                s4 = peg$FAILED;
              }
            } else {
              peg$currPos = s4;
              s4 = peg$FAILED;
            }
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseRPOINT();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c35(s2, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseEmptyWildcardTypeArguments() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseLPOINT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseRPOINT();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c110();
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseTypeArgumentsOrDiamond() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseLPOINT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseRPOINT();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c110();
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$parseTypeArguments();
      }

      return s0;
    }

    function peg$parseNonWildcardTypeArgumentsOrDiamond() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseLPOINT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseRPOINT();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$parseNonWildcardTypeArguments();
      }

      return s0;
    }

    function peg$parseExplicitGenericInvocationSuffix() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseSUPER();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSuperSuffix();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c111(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseIdentifier();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseArguments();
          if (s2 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c112(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }

      return s0;
    }

    function peg$parsePrefixOp() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parseINC();
      if (s1 === peg$FAILED) {
        s1 = peg$parseDEC();
        if (s1 === peg$FAILED) {
          s1 = peg$parseBANG();
          if (s1 === peg$FAILED) {
            s1 = peg$parseTILDA();
            if (s1 === peg$FAILED) {
              s1 = peg$parsePLUS();
              if (s1 === peg$FAILED) {
                s1 = peg$parseMINUS();
              }
            }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c113(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsePostfixOp() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parseINC();
      if (s1 === peg$FAILED) {
        s1 = peg$parseDEC();
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c113(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseSelector() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseDOT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseIdentifier();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseArguments();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c112(s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseDOT();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseIdentifier();
          if (s2 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c114(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parseDOT();
          if (s1 !== peg$FAILED) {
            s2 = peg$parseExplicitGenericInvocation();
            if (s2 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c115(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parseDOT();
            if (s1 !== peg$FAILED) {
              s2 = peg$parseTHIS();
              if (s2 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c116();
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              s1 = peg$parseDOT();
              if (s1 !== peg$FAILED) {
                s2 = peg$parseSUPER();
                if (s2 !== peg$FAILED) {
                  s3 = peg$parseSuperSuffix();
                  if (s3 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c111(s3);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
              if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                s1 = peg$parseDOT();
                if (s1 !== peg$FAILED) {
                  s2 = peg$parseNEW();
                  if (s2 !== peg$FAILED) {
                    s3 = peg$parseNonWildcardTypeArguments();
                    if (s3 === peg$FAILED) {
                      s3 = null;
                    }
                    if (s3 !== peg$FAILED) {
                      s4 = peg$parseInnerCreator();
                      if (s4 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c117(s3, s4);
                        s0 = s1;
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
                if (s0 === peg$FAILED) {
                  s0 = peg$currPos;
                  s1 = peg$parseDimExpr();
                  if (s1 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c118(s1);
                  }
                  s0 = s1;
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parseSuperSuffix() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseArguments();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c119(s1);
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseDOT();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseNonWildcardTypeArguments();
          if (s2 === peg$FAILED) {
            s2 = null;
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parseIdentifier();
            if (s3 !== peg$FAILED) {
              s4 = peg$parseArguments();
              if (s4 === peg$FAILED) {
                s4 = null;
              }
              if (s4 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c120(s2, s3, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }

      return s0;
    }

    function peg$parseBasicType() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 4) === peg$c121) {
        s1 = peg$c121;
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c122); }
      }
      if (s1 === peg$FAILED) {
        if (input.substr(peg$currPos, 5) === peg$c123) {
          s1 = peg$c123;
          peg$currPos += 5;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c124); }
        }
        if (s1 === peg$FAILED) {
          if (input.substr(peg$currPos, 4) === peg$c125) {
            s1 = peg$c125;
            peg$currPos += 4;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c126); }
          }
          if (s1 === peg$FAILED) {
            if (input.substr(peg$currPos, 3) === peg$c127) {
              s1 = peg$c127;
              peg$currPos += 3;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c128); }
            }
            if (s1 === peg$FAILED) {
              if (input.substr(peg$currPos, 4) === peg$c129) {
                s1 = peg$c129;
                peg$currPos += 4;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c130); }
              }
              if (s1 === peg$FAILED) {
                if (input.substr(peg$currPos, 5) === peg$c131) {
                  s1 = peg$c131;
                  peg$currPos += 5;
                } else {
                  s1 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c132); }
                }
                if (s1 === peg$FAILED) {
                  if (input.substr(peg$currPos, 6) === peg$c133) {
                    s1 = peg$c133;
                    peg$currPos += 6;
                  } else {
                    s1 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c134); }
                  }
                  if (s1 === peg$FAILED) {
                    if (input.substr(peg$currPos, 7) === peg$c135) {
                      s1 = peg$c135;
                      peg$currPos += 7;
                    } else {
                      s1 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c136); }
                    }
                  }
                }
              }
            }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parseLetterOrDigit();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseSpacing();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c137(s1);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseArguments() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      s0 = peg$currPos;
      s1 = peg$parseLPAR();
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        s3 = peg$parseExpression();
        if (s3 !== peg$FAILED) {
          s4 = [];
          s5 = peg$currPos;
          s6 = peg$parseCOMMA();
          if (s6 !== peg$FAILED) {
            s7 = peg$parseExpression();
            if (s7 !== peg$FAILED) {
              s6 = [s6, s7];
              s5 = s6;
            } else {
              peg$currPos = s5;
              s5 = peg$FAILED;
            }
          } else {
            peg$currPos = s5;
            s5 = peg$FAILED;
          }
          while (s5 !== peg$FAILED) {
            s4.push(s5);
            s5 = peg$currPos;
            s6 = peg$parseCOMMA();
            if (s6 !== peg$FAILED) {
              s7 = peg$parseExpression();
              if (s7 !== peg$FAILED) {
                s6 = [s6, s7];
                s5 = s6;
              } else {
                peg$currPos = s5;
                s5 = peg$FAILED;
              }
            } else {
              peg$currPos = s5;
              s5 = peg$FAILED;
            }
          }
          if (s4 !== peg$FAILED) {
            peg$savedPos = s2;
            s3 = peg$c35(s3, s4);
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseEmptyLines();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseRPAR();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c138(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseCreator() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseBasicType();
      if (s1 === peg$FAILED) {
        s1 = peg$parseCreatedName();
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseArrayCreatorRest();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c139(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseNonWildcardTypeArguments();
        if (s1 === peg$FAILED) {
          s1 = peg$parseEmptyWildcardTypeArguments();
        }
        if (s1 === peg$FAILED) {
          s1 = null;
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parseCreatedName();
          if (s2 !== peg$FAILED) {
            s3 = peg$parseClassCreatorRest();
            if (s3 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c140(s1, s2, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }

      return s0;
    }

    function peg$parseCreatedName() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      s0 = peg$currPos;
      s1 = peg$parseQualifiedIdentifier();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseTypeArgumentsOrDiamond();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$currPos;
          s5 = peg$parseDOT();
          if (s5 !== peg$FAILED) {
            s6 = peg$parseIdentifier();
            if (s6 !== peg$FAILED) {
              s7 = peg$parseTypeArgumentsOrDiamond();
              if (s7 === peg$FAILED) {
                s7 = null;
              }
              if (s7 !== peg$FAILED) {
                s5 = [s5, s6, s7];
                s4 = s5;
              } else {
                peg$currPos = s4;
                s4 = peg$FAILED;
              }
            } else {
              peg$currPos = s4;
              s4 = peg$FAILED;
            }
          } else {
            peg$currPos = s4;
            s4 = peg$FAILED;
          }
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$currPos;
            s5 = peg$parseDOT();
            if (s5 !== peg$FAILED) {
              s6 = peg$parseIdentifier();
              if (s6 !== peg$FAILED) {
                s7 = peg$parseTypeArgumentsOrDiamond();
                if (s7 === peg$FAILED) {
                  s7 = null;
                }
                if (s7 !== peg$FAILED) {
                  s5 = [s5, s6, s7];
                  s4 = s5;
                } else {
                  peg$currPos = s4;
                  s4 = peg$FAILED;
                }
              } else {
                peg$currPos = s4;
                s4 = peg$FAILED;
              }
            } else {
              peg$currPos = s4;
              s4 = peg$FAILED;
            }
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c141(s1, s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseInnerCreator() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseIdentifier();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseNonWildcardTypeArgumentsOrDiamond();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseClassCreatorRest();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c142(s1, s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseClassCreatorRest() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseArguments();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseClassBody();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c143(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseArrayCreatorRest() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parseDim();
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parseDim();
        }
      } else {
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseArrayInitializer();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c144(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parseDimExpr();
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$parseDimExpr();
          }
        } else {
          s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parseDim();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parseDim();
          }
          if (s2 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c145(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parseDim();
          if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c146(s1);
          }
          s0 = s1;
        }
      }

      return s0;
    }

    function peg$parseArrayInitializer() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      s0 = peg$currPos;
      s1 = peg$parseLWING();
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        s3 = peg$parseVariableInitializer();
        if (s3 !== peg$FAILED) {
          s4 = [];
          s5 = peg$currPos;
          s6 = peg$parseCOMMA();
          if (s6 !== peg$FAILED) {
            s7 = peg$parseVariableInitializer();
            if (s7 !== peg$FAILED) {
              s6 = [s6, s7];
              s5 = s6;
            } else {
              peg$currPos = s5;
              s5 = peg$FAILED;
            }
          } else {
            peg$currPos = s5;
            s5 = peg$FAILED;
          }
          while (s5 !== peg$FAILED) {
            s4.push(s5);
            s5 = peg$currPos;
            s6 = peg$parseCOMMA();
            if (s6 !== peg$FAILED) {
              s7 = peg$parseVariableInitializer();
              if (s7 !== peg$FAILED) {
                s6 = [s6, s7];
                s5 = s6;
              } else {
                peg$currPos = s5;
                s5 = peg$FAILED;
              }
            } else {
              peg$currPos = s5;
              s5 = peg$FAILED;
            }
          }
          if (s4 !== peg$FAILED) {
            peg$savedPos = s2;
            s3 = peg$c35(s3, s4);
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseCOMMA();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseEmptyLines();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseRWING();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c147(s2);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseVariableInitializer() {
      var s0;

      s0 = peg$parseArrayInitializer();
      if (s0 === peg$FAILED) {
        s0 = peg$parseExpression();
      }

      return s0;
    }

    function peg$parseParExpression() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseLPAR();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseExpression();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseRPAR();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c148(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseQualifiedIdentifier() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseIdentifier();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parseDOT();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseIdentifier();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parseDOT();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseIdentifier();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c149(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseDim() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseLBRK();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseRBRK();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseDimExpr() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseLBRK();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseExpression();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseRBRK();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c150(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseType() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseBasicType();
      if (s1 === peg$FAILED) {
        s1 = peg$parseClassType();
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseDim();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseDim();
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c151(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseReferenceType() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseBasicType();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseDim();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parseDim();
          }
        } else {
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c152(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseClassType();
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parseDim();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parseDim();
          }
          if (s2 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c153(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }

      return s0;
    }

    function peg$parseClassType() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8;

      s0 = peg$currPos;
      s1 = peg$parseEmptyLines();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseQualifiedIdentifier();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseTypeArguments();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = [];
            s5 = peg$currPos;
            s6 = peg$parseDOT();
            if (s6 !== peg$FAILED) {
              s7 = peg$parseIdentifier();
              if (s7 !== peg$FAILED) {
                s8 = peg$parseTypeArguments();
                if (s8 === peg$FAILED) {
                  s8 = null;
                }
                if (s8 !== peg$FAILED) {
                  s6 = [s6, s7, s8];
                  s5 = s6;
                } else {
                  peg$currPos = s5;
                  s5 = peg$FAILED;
                }
              } else {
                peg$currPos = s5;
                s5 = peg$FAILED;
              }
            } else {
              peg$currPos = s5;
              s5 = peg$FAILED;
            }
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              s5 = peg$currPos;
              s6 = peg$parseDOT();
              if (s6 !== peg$FAILED) {
                s7 = peg$parseIdentifier();
                if (s7 !== peg$FAILED) {
                  s8 = peg$parseTypeArguments();
                  if (s8 === peg$FAILED) {
                    s8 = null;
                  }
                  if (s8 !== peg$FAILED) {
                    s6 = [s6, s7, s8];
                    s5 = s6;
                  } else {
                    peg$currPos = s5;
                    s5 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s5;
                  s5 = peg$FAILED;
                }
              } else {
                peg$currPos = s5;
                s5 = peg$FAILED;
              }
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c141(s2, s3, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseClassTypeList() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseClassType();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parseCOMMA();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseClassType();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parseCOMMA();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseClassType();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c35(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseTypeArguments() {
      var s0, s1, s2, s3, s4, s5, s6;

      s0 = peg$currPos;
      s1 = peg$parseLPOINT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseTypeArgument();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$currPos;
          s5 = peg$parseCOMMA();
          if (s5 !== peg$FAILED) {
            s6 = peg$parseTypeArgument();
            if (s6 !== peg$FAILED) {
              s5 = [s5, s6];
              s4 = s5;
            } else {
              peg$currPos = s4;
              s4 = peg$FAILED;
            }
          } else {
            peg$currPos = s4;
            s4 = peg$FAILED;
          }
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$currPos;
            s5 = peg$parseCOMMA();
            if (s5 !== peg$FAILED) {
              s6 = peg$parseTypeArgument();
              if (s6 !== peg$FAILED) {
                s5 = [s5, s6];
                s4 = s5;
              } else {
                peg$currPos = s4;
                s4 = peg$FAILED;
              }
            } else {
              peg$currPos = s4;
              s4 = peg$FAILED;
            }
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseEmptyLines();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseRPOINT();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c35(s2, s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseTypeArgument() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseEmptyLines();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseReferenceType();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c154(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseEmptyLines();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseQUERY();
          if (s2 !== peg$FAILED) {
            s3 = peg$currPos;
            s4 = peg$currPos;
            s5 = peg$parseEXTENDS();
            if (s5 !== peg$FAILED) {
              peg$savedPos = s4;
              s5 = peg$c155();
            }
            s4 = s5;
            if (s4 === peg$FAILED) {
              s4 = peg$currPos;
              s5 = peg$parseSUPER();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s4;
                s5 = peg$c156();
              }
              s4 = s5;
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parseReferenceType();
              if (s5 !== peg$FAILED) {
                s4 = [s4, s5];
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
            if (s3 === peg$FAILED) {
              s3 = null;
            }
            if (s3 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c157(s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }

      return s0;
    }

    function peg$parseTypeParameters() {
      var s0, s1, s2, s3, s4, s5, s6;

      s0 = peg$currPos;
      s1 = peg$parseLPOINT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseTypeParameter();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$currPos;
          s5 = peg$parseCOMMA();
          if (s5 !== peg$FAILED) {
            s6 = peg$parseTypeParameter();
            if (s6 !== peg$FAILED) {
              s5 = [s5, s6];
              s4 = s5;
            } else {
              peg$currPos = s4;
              s4 = peg$FAILED;
            }
          } else {
            peg$currPos = s4;
            s4 = peg$FAILED;
          }
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$currPos;
            s5 = peg$parseCOMMA();
            if (s5 !== peg$FAILED) {
              s6 = peg$parseTypeParameter();
              if (s6 !== peg$FAILED) {
                s5 = [s5, s6];
                s4 = s5;
              } else {
                peg$currPos = s4;
                s4 = peg$FAILED;
              }
            } else {
              peg$currPos = s4;
              s4 = peg$FAILED;
            }
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseEmptyLines();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseRPOINT();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c35(s2, s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseTypeParameter() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseEmptyLines();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseIdentifier();
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          s4 = peg$parseEXTENDS();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseBound();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c158(s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseEmptyLines();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseQUERY();
          if (s2 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c159();
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }

      return s0;
    }

    function peg$parseBound() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseClassType();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parseAND();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseClassType();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parseAND();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseClassType();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c35(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseModifier() {
      var s0, s1, s2, s3, s4;

      s0 = peg$parseAnnotation();
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseIndent();
        if (s1 !== peg$FAILED) {
          if (input.substr(peg$currPos, 6) === peg$c160) {
            s2 = peg$c160;
            peg$currPos += 6;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c161); }
          }
          if (s2 === peg$FAILED) {
            if (input.substr(peg$currPos, 9) === peg$c162) {
              s2 = peg$c162;
              peg$currPos += 9;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c163); }
            }
            if (s2 === peg$FAILED) {
              if (input.substr(peg$currPos, 7) === peg$c164) {
                s2 = peg$c164;
                peg$currPos += 7;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c165); }
              }
              if (s2 === peg$FAILED) {
                if (input.substr(peg$currPos, 6) === peg$c166) {
                  s2 = peg$c166;
                  peg$currPos += 6;
                } else {
                  s2 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c167); }
                }
                if (s2 === peg$FAILED) {
                  if (input.substr(peg$currPos, 8) === peg$c168) {
                    s2 = peg$c168;
                    peg$currPos += 8;
                  } else {
                    s2 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c169); }
                  }
                  if (s2 === peg$FAILED) {
                    if (input.substr(peg$currPos, 5) === peg$c170) {
                      s2 = peg$c170;
                      peg$currPos += 5;
                    } else {
                      s2 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c171); }
                    }
                    if (s2 === peg$FAILED) {
                      if (input.substr(peg$currPos, 6) === peg$c172) {
                        s2 = peg$c172;
                        peg$currPos += 6;
                      } else {
                        s2 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c173); }
                      }
                      if (s2 === peg$FAILED) {
                        if (input.substr(peg$currPos, 12) === peg$c174) {
                          s2 = peg$c174;
                          peg$currPos += 12;
                        } else {
                          s2 = peg$FAILED;
                          if (peg$silentFails === 0) { peg$fail(peg$c175); }
                        }
                        if (s2 === peg$FAILED) {
                          if (input.substr(peg$currPos, 9) === peg$c176) {
                            s2 = peg$c176;
                            peg$currPos += 9;
                          } else {
                            s2 = peg$FAILED;
                            if (peg$silentFails === 0) { peg$fail(peg$c177); }
                          }
                          if (s2 === peg$FAILED) {
                            if (input.substr(peg$currPos, 8) === peg$c178) {
                              s2 = peg$c178;
                              peg$currPos += 8;
                            } else {
                              s2 = peg$FAILED;
                              if (peg$silentFails === 0) { peg$fail(peg$c179); }
                            }
                            if (s2 === peg$FAILED) {
                              if (input.substr(peg$currPos, 8) === peg$c180) {
                                s2 = peg$c180;
                                peg$currPos += 8;
                              } else {
                                s2 = peg$FAILED;
                                if (peg$silentFails === 0) { peg$fail(peg$c181); }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$currPos;
            peg$silentFails++;
            s4 = peg$parseLetterOrDigit();
            peg$silentFails--;
            if (s4 === peg$FAILED) {
              s3 = void 0;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
            if (s3 !== peg$FAILED) {
              s4 = peg$parseSpacing();
              if (s4 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c182(s2);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }

      return s0;
    }

    function peg$parseAnnotationTypeDeclaration() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseAT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseINTERFACE();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseIdentifier();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseAnnotationTypeBody();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c183(s3, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseAnnotationTypeBody() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseLWING();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseAnnotationTypeElementDeclaration();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseAnnotationTypeElementDeclaration();
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseRWING();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c184(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseAnnotationTypeElementDeclaration() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parseModifier();
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$parseModifier();
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseAnnotationTypeElementRest();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c185(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseSEMI();
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c3();
        }
        s0 = s1;
      }

      return s0;
    }

    function peg$parseAnnotationTypeElementRest() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseType();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseAnnotationMethodOrConstantRest();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseSEMI();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c186(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$parseClassDeclaration();
        if (s0 === peg$FAILED) {
          s0 = peg$parseEnumDeclaration();
          if (s0 === peg$FAILED) {
            s0 = peg$parseInterfaceDeclaration();
            if (s0 === peg$FAILED) {
              s0 = peg$parseAnnotationTypeDeclaration();
            }
          }
        }
      }

      return s0;
    }

    function peg$parseAnnotationMethodOrConstantRest() {
      var s0;

      s0 = peg$parseAnnotationMethodRest();
      if (s0 === peg$FAILED) {
        s0 = peg$parseAnnotationConstantRest();
      }

      return s0;
    }

    function peg$parseAnnotationMethodRest() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIdentifier();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseLPAR();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseRPAR();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseDefaultValue();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c187(s1, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseAnnotationConstantRest() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parseVariableDeclarators();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c188(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseDefaultValue() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseDEFAULT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseElementValue();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c189(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseAnnotation() {
      var s0;

      s0 = peg$parseNormalAnnotation();
      if (s0 === peg$FAILED) {
        s0 = peg$parseSingleElementAnnotation();
        if (s0 === peg$FAILED) {
          s0 = peg$parseMarkerAnnotation();
        }
      }

      return s0;
    }

    function peg$parseNormalAnnotation() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseAT();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseQualifiedIdentifier();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseLPAR();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseElementValuePairs();
              if (s5 === peg$FAILED) {
                s5 = null;
              }
              if (s5 !== peg$FAILED) {
                s6 = peg$parseIndent();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseRPAR();
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parseSpacing();
                    if (s8 !== peg$FAILED) {
                      peg$savedPos = s0;
                      s1 = peg$c190(s3, s5);
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseSingleElementAnnotation() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseAT();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseQualifiedIdentifier();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseLPAR();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseElementValue();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseRPAR();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseSpacing();
                  if (s7 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c191(s3, s5);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseMarkerAnnotation() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseAT();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseQualifiedIdentifier();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSpacing();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c192(s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseElementValuePairs() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseElementValuePair();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parseCOMMA();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseElementValuePair();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parseCOMMA();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseElementValuePair();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c35(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseElementValuePair() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseIdentifier();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseEQU();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseElementValue();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c193(s2, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseElementValue() {
      var s0;

      s0 = peg$parseConditionalExpression();
      if (s0 === peg$FAILED) {
        s0 = peg$parseAnnotation();
        if (s0 === peg$FAILED) {
          s0 = peg$parseElementValueArrayInitializer();
        }
      }

      return s0;
    }

    function peg$parseElementValueArrayInitializer() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseLWING();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseElementValues();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseCOMMA();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseRWING();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c194(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseElementValues() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseElementValue();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parseCOMMA();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseElementValue();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parseCOMMA();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseElementValue();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c35(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseIndent() {
      var s0, s1;

      s0 = [];
      if (peg$c195.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c196); }
      }
      while (s1 !== peg$FAILED) {
        s0.push(s1);
        if (peg$c195.test(input.charAt(peg$currPos))) {
          s1 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c196); }
        }
      }

      return s0;
    }

    function peg$parseSpacing() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseWhiteSpaces();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseWhiteSpaces() {
      var s0;

      if (peg$c12.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c13); }
      }

      return s0;
    }

    function peg$parseEmptyLines() {
      var s0, s1;

      s0 = [];
      if (peg$c197.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c198); }
      }
      while (s1 !== peg$FAILED) {
        s0.push(s1);
        if (peg$c197.test(input.charAt(peg$currPos))) {
          s1 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c198); }
        }
      }

      return s0;
    }

    function peg$parseLeadingComments() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parseCommentStatement();
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$parseCommentStatement();
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c199(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseCommentStatement() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$currPos;
      s2 = peg$parseJavaDocComment();
      if (s2 !== peg$FAILED) {
        s3 = [];
        if (peg$c12.test(input.charAt(peg$currPos))) {
          s4 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c13); }
        }
        while (s4 !== peg$FAILED) {
          s3.push(s4);
          if (peg$c12.test(input.charAt(peg$currPos))) {
            s4 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c13); }
          }
        }
        if (s3 !== peg$FAILED) {
          peg$savedPos = s1;
          s2 = peg$c200(s2);
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 === peg$FAILED) {
        s1 = peg$currPos;
        s2 = peg$parseTraditionalComment();
        if (s2 !== peg$FAILED) {
          s3 = [];
          if (peg$c12.test(input.charAt(peg$currPos))) {
            s4 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c13); }
          }
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            if (peg$c12.test(input.charAt(peg$currPos))) {
              s4 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c13); }
            }
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s1;
            s2 = peg$c200(s2);
            s1 = s2;
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
        if (s1 === peg$FAILED) {
          s1 = peg$currPos;
          s2 = peg$parseEndOfLineComment();
          if (s2 !== peg$FAILED) {
            s3 = [];
            if (peg$c12.test(input.charAt(peg$currPos))) {
              s4 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c13); }
            }
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              if (peg$c12.test(input.charAt(peg$currPos))) {
                s4 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c13); }
              }
            }
            if (s3 !== peg$FAILED) {
              peg$savedPos = s1;
              s2 = peg$c200(s2);
              s1 = s2;
            } else {
              peg$currPos = s1;
              s1 = peg$FAILED;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c201(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseJavaDocComment() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 3) === peg$c202) {
        s1 = peg$c202;
        peg$currPos += 3;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c203); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseMultilineCommentLetter();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseMultilineCommentLetter();
        }
        if (s2 !== peg$FAILED) {
          if (input.substr(peg$currPos, 2) === peg$c204) {
            s3 = peg$c204;
            peg$currPos += 2;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c205); }
          }
          if (s3 !== peg$FAILED) {
            if (peg$c12.test(input.charAt(peg$currPos))) {
              s4 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c13); }
            }
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c206(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseTraditionalComment() {
      var s0, s1, s2, s3, s4, s5, s6;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c207) {
        s1 = peg$c207;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c208); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 42) {
          s4 = peg$c209;
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c210); }
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$currPos;
          peg$silentFails++;
          if (input.charCodeAt(peg$currPos) === 47) {
            s6 = peg$c211;
            peg$currPos++;
          } else {
            s6 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c212); }
          }
          peg$silentFails--;
          if (s6 === peg$FAILED) {
            s5 = void 0;
          } else {
            peg$currPos = s5;
            s5 = peg$FAILED;
          }
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseMultilineCommentLetter();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parseMultilineCommentLetter();
          }
          if (s3 !== peg$FAILED) {
            if (input.substr(peg$currPos, 2) === peg$c204) {
              s4 = peg$c204;
              peg$currPos += 2;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c205); }
            }
            if (s4 !== peg$FAILED) {
              if (peg$c12.test(input.charAt(peg$currPos))) {
                s5 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s5 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c13); }
              }
              if (s5 === peg$FAILED) {
                s5 = null;
              }
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c213(s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseMultilineCommentLetter() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$currPos;
      s2 = peg$currPos;
      peg$silentFails++;
      if (input.substr(peg$currPos, 2) === peg$c204) {
        s3 = peg$c204;
        peg$currPos += 2;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c205); }
      }
      peg$silentFails--;
      if (s3 === peg$FAILED) {
        s2 = void 0;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parse_();
        if (s3 !== peg$FAILED) {
          s2 = [s2, s3];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c214(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseEndOfLineComment() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c215) {
        s1 = peg$c215;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c216); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseCommentLetter();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseCommentLetter();
        }
        if (s2 !== peg$FAILED) {
          if (peg$c12.test(input.charAt(peg$currPos))) {
            s3 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c13); }
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c217(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseCommentLetter() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$currPos;
      s2 = peg$currPos;
      peg$silentFails++;
      if (peg$c12.test(input.charAt(peg$currPos))) {
        s3 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c13); }
      }
      peg$silentFails--;
      if (s3 === peg$FAILED) {
        s2 = void 0;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parse_();
        if (s3 !== peg$FAILED) {
          s2 = [s2, s3];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c214(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseIdentifier() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$currPos;
      peg$silentFails++;
      s2 = peg$parseKeyword();
      peg$silentFails--;
      if (s2 === peg$FAILED) {
        s1 = void 0;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseLetter();
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          s4 = [];
          s5 = peg$parseLetterOrDigit();
          while (s5 !== peg$FAILED) {
            s4.push(s5);
            s5 = peg$parseLetterOrDigit();
          }
          if (s4 !== peg$FAILED) {
            s3 = input.substring(s3, peg$currPos);
          } else {
            s3 = s4;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSpacing();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c218(s2, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseLetter() {
      var s0;

      if (peg$c219.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c220); }
      }
      if (s0 === peg$FAILED) {
        if (peg$c221.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c222); }
        }
        if (s0 === peg$FAILED) {
          if (peg$c223.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c224); }
          }
        }
      }

      return s0;
    }

    function peg$parseLetterOrDigit() {
      var s0;

      if (peg$c219.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c220); }
      }
      if (s0 === peg$FAILED) {
        if (peg$c221.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c222); }
        }
        if (s0 === peg$FAILED) {
          if (peg$c225.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c226); }
          }
          if (s0 === peg$FAILED) {
            if (peg$c223.test(input.charAt(peg$currPos))) {
              s0 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c224); }
            }
          }
        }
      }

      return s0;
    }

    function peg$parseKeyword() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 8) === peg$c168) {
        s1 = peg$c168;
        peg$currPos += 8;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c169); }
      }
      if (s1 === peg$FAILED) {
        if (input.substr(peg$currPos, 6) === peg$c227) {
          s1 = peg$c227;
          peg$currPos += 6;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c228); }
        }
        if (s1 === peg$FAILED) {
          if (input.substr(peg$currPos, 7) === peg$c135) {
            s1 = peg$c135;
            peg$currPos += 7;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c136); }
          }
          if (s1 === peg$FAILED) {
            if (input.substr(peg$currPos, 5) === peg$c229) {
              s1 = peg$c229;
              peg$currPos += 5;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c230); }
            }
            if (s1 === peg$FAILED) {
              if (input.substr(peg$currPos, 4) === peg$c121) {
                s1 = peg$c121;
                peg$currPos += 4;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c122); }
              }
              if (s1 === peg$FAILED) {
                if (input.substr(peg$currPos, 4) === peg$c231) {
                  s1 = peg$c231;
                  peg$currPos += 4;
                } else {
                  s1 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c232); }
                }
                if (s1 === peg$FAILED) {
                  if (input.substr(peg$currPos, 5) === peg$c233) {
                    s1 = peg$c233;
                    peg$currPos += 5;
                  } else {
                    s1 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c234); }
                  }
                  if (s1 === peg$FAILED) {
                    if (input.substr(peg$currPos, 4) === peg$c125) {
                      s1 = peg$c125;
                      peg$currPos += 4;
                    } else {
                      s1 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c126); }
                    }
                    if (s1 === peg$FAILED) {
                      if (input.substr(peg$currPos, 5) === peg$c235) {
                        s1 = peg$c235;
                        peg$currPos += 5;
                      } else {
                        s1 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c236); }
                      }
                      if (s1 === peg$FAILED) {
                        if (input.substr(peg$currPos, 5) === peg$c237) {
                          s1 = peg$c237;
                          peg$currPos += 5;
                        } else {
                          s1 = peg$FAILED;
                          if (peg$silentFails === 0) { peg$fail(peg$c238); }
                        }
                        if (s1 === peg$FAILED) {
                          if (input.substr(peg$currPos, 8) === peg$c239) {
                            s1 = peg$c239;
                            peg$currPos += 8;
                          } else {
                            s1 = peg$FAILED;
                            if (peg$silentFails === 0) { peg$fail(peg$c240); }
                          }
                          if (s1 === peg$FAILED) {
                            if (input.substr(peg$currPos, 7) === peg$c241) {
                              s1 = peg$c241;
                              peg$currPos += 7;
                            } else {
                              s1 = peg$FAILED;
                              if (peg$silentFails === 0) { peg$fail(peg$c242); }
                            }
                            if (s1 === peg$FAILED) {
                              if (input.substr(peg$currPos, 6) === peg$c133) {
                                s1 = peg$c133;
                                peg$currPos += 6;
                              } else {
                                s1 = peg$FAILED;
                                if (peg$silentFails === 0) { peg$fail(peg$c134); }
                              }
                              if (s1 === peg$FAILED) {
                                if (input.substr(peg$currPos, 2) === peg$c243) {
                                  s1 = peg$c243;
                                  peg$currPos += 2;
                                } else {
                                  s1 = peg$FAILED;
                                  if (peg$silentFails === 0) { peg$fail(peg$c244); }
                                }
                                if (s1 === peg$FAILED) {
                                  if (input.substr(peg$currPos, 4) === peg$c245) {
                                    s1 = peg$c245;
                                    peg$currPos += 4;
                                  } else {
                                    s1 = peg$FAILED;
                                    if (peg$silentFails === 0) { peg$fail(peg$c246); }
                                  }
                                  if (s1 === peg$FAILED) {
                                    if (input.substr(peg$currPos, 4) === peg$c247) {
                                      s1 = peg$c247;
                                      peg$currPos += 4;
                                    } else {
                                      s1 = peg$FAILED;
                                      if (peg$silentFails === 0) { peg$fail(peg$c248); }
                                    }
                                    if (s1 === peg$FAILED) {
                                      if (input.substr(peg$currPos, 7) === peg$c249) {
                                        s1 = peg$c249;
                                        peg$currPos += 7;
                                      } else {
                                        s1 = peg$FAILED;
                                        if (peg$silentFails === 0) { peg$fail(peg$c250); }
                                      }
                                      if (s1 === peg$FAILED) {
                                        if (input.substr(peg$currPos, 5) === peg$c251) {
                                          s1 = peg$c251;
                                          peg$currPos += 5;
                                        } else {
                                          s1 = peg$FAILED;
                                          if (peg$silentFails === 0) { peg$fail(peg$c252); }
                                        }
                                        if (s1 === peg$FAILED) {
                                          if (input.substr(peg$currPos, 7) === peg$c253) {
                                            s1 = peg$c253;
                                            peg$currPos += 7;
                                          } else {
                                            s1 = peg$FAILED;
                                            if (peg$silentFails === 0) { peg$fail(peg$c254); }
                                          }
                                          if (s1 === peg$FAILED) {
                                            if (input.substr(peg$currPos, 5) === peg$c170) {
                                              s1 = peg$c170;
                                              peg$currPos += 5;
                                            } else {
                                              s1 = peg$FAILED;
                                              if (peg$silentFails === 0) { peg$fail(peg$c171); }
                                            }
                                            if (s1 === peg$FAILED) {
                                              if (input.substr(peg$currPos, 5) === peg$c131) {
                                                s1 = peg$c131;
                                                peg$currPos += 5;
                                              } else {
                                                s1 = peg$FAILED;
                                                if (peg$silentFails === 0) { peg$fail(peg$c132); }
                                              }
                                              if (s1 === peg$FAILED) {
                                                if (input.substr(peg$currPos, 3) === peg$c255) {
                                                  s1 = peg$c255;
                                                  peg$currPos += 3;
                                                } else {
                                                  s1 = peg$FAILED;
                                                  if (peg$silentFails === 0) { peg$fail(peg$c256); }
                                                }
                                                if (s1 === peg$FAILED) {
                                                  if (input.substr(peg$currPos, 4) === peg$c257) {
                                                    s1 = peg$c257;
                                                    peg$currPos += 4;
                                                  } else {
                                                    s1 = peg$FAILED;
                                                    if (peg$silentFails === 0) { peg$fail(peg$c258); }
                                                  }
                                                  if (s1 === peg$FAILED) {
                                                    if (input.substr(peg$currPos, 2) === peg$c259) {
                                                      s1 = peg$c259;
                                                      peg$currPos += 2;
                                                    } else {
                                                      s1 = peg$FAILED;
                                                      if (peg$silentFails === 0) { peg$fail(peg$c260); }
                                                    }
                                                    if (s1 === peg$FAILED) {
                                                      if (input.substr(peg$currPos, 10) === peg$c261) {
                                                        s1 = peg$c261;
                                                        peg$currPos += 10;
                                                      } else {
                                                        s1 = peg$FAILED;
                                                        if (peg$silentFails === 0) { peg$fail(peg$c262); }
                                                      }
                                                      if (s1 === peg$FAILED) {
                                                        if (input.substr(peg$currPos, 6) === peg$c263) {
                                                          s1 = peg$c263;
                                                          peg$currPos += 6;
                                                        } else {
                                                          s1 = peg$FAILED;
                                                          if (peg$silentFails === 0) { peg$fail(peg$c264); }
                                                        }
                                                        if (s1 === peg$FAILED) {
                                                          if (input.substr(peg$currPos, 9) === peg$c265) {
                                                            s1 = peg$c265;
                                                            peg$currPos += 9;
                                                          } else {
                                                            s1 = peg$FAILED;
                                                            if (peg$silentFails === 0) { peg$fail(peg$c266); }
                                                          }
                                                          if (s1 === peg$FAILED) {
                                                            if (input.substr(peg$currPos, 3) === peg$c127) {
                                                              s1 = peg$c127;
                                                              peg$currPos += 3;
                                                            } else {
                                                              s1 = peg$FAILED;
                                                              if (peg$silentFails === 0) { peg$fail(peg$c128); }
                                                            }
                                                            if (s1 === peg$FAILED) {
                                                              if (input.substr(peg$currPos, 10) === peg$c267) {
                                                                s1 = peg$c267;
                                                                peg$currPos += 10;
                                                              } else {
                                                                s1 = peg$FAILED;
                                                                if (peg$silentFails === 0) { peg$fail(peg$c268); }
                                                              }
                                                              if (s1 === peg$FAILED) {
                                                                if (input.substr(peg$currPos, 4) === peg$c129) {
                                                                  s1 = peg$c129;
                                                                  peg$currPos += 4;
                                                                } else {
                                                                  s1 = peg$FAILED;
                                                                  if (peg$silentFails === 0) { peg$fail(peg$c130); }
                                                                }
                                                                if (s1 === peg$FAILED) {
                                                                  if (input.substr(peg$currPos, 6) === peg$c172) {
                                                                    s1 = peg$c172;
                                                                    peg$currPos += 6;
                                                                  } else {
                                                                    s1 = peg$FAILED;
                                                                    if (peg$silentFails === 0) { peg$fail(peg$c173); }
                                                                  }
                                                                  if (s1 === peg$FAILED) {
                                                                    if (input.substr(peg$currPos, 3) === peg$c269) {
                                                                      s1 = peg$c269;
                                                                      peg$currPos += 3;
                                                                    } else {
                                                                      s1 = peg$FAILED;
                                                                      if (peg$silentFails === 0) { peg$fail(peg$c270); }
                                                                    }
                                                                    if (s1 === peg$FAILED) {
                                                                      if (input.substr(peg$currPos, 4) === peg$c271) {
                                                                        s1 = peg$c271;
                                                                        peg$currPos += 4;
                                                                      } else {
                                                                        s1 = peg$FAILED;
                                                                        if (peg$silentFails === 0) { peg$fail(peg$c272); }
                                                                      }
                                                                      if (s1 === peg$FAILED) {
                                                                        if (input.substr(peg$currPos, 7) === peg$c273) {
                                                                          s1 = peg$c273;
                                                                          peg$currPos += 7;
                                                                        } else {
                                                                          s1 = peg$FAILED;
                                                                          if (peg$silentFails === 0) { peg$fail(peg$c274); }
                                                                        }
                                                                        if (s1 === peg$FAILED) {
                                                                          if (input.substr(peg$currPos, 7) === peg$c164) {
                                                                            s1 = peg$c164;
                                                                            peg$currPos += 7;
                                                                          } else {
                                                                            s1 = peg$FAILED;
                                                                            if (peg$silentFails === 0) { peg$fail(peg$c165); }
                                                                          }
                                                                          if (s1 === peg$FAILED) {
                                                                            if (input.substr(peg$currPos, 9) === peg$c162) {
                                                                              s1 = peg$c162;
                                                                              peg$currPos += 9;
                                                                            } else {
                                                                              s1 = peg$FAILED;
                                                                              if (peg$silentFails === 0) { peg$fail(peg$c163); }
                                                                            }
                                                                            if (s1 === peg$FAILED) {
                                                                              if (input.substr(peg$currPos, 6) === peg$c160) {
                                                                                s1 = peg$c160;
                                                                                peg$currPos += 6;
                                                                              } else {
                                                                                s1 = peg$FAILED;
                                                                                if (peg$silentFails === 0) { peg$fail(peg$c161); }
                                                                              }
                                                                              if (s1 === peg$FAILED) {
                                                                                if (input.substr(peg$currPos, 6) === peg$c275) {
                                                                                  s1 = peg$c275;
                                                                                  peg$currPos += 6;
                                                                                } else {
                                                                                  s1 = peg$FAILED;
                                                                                  if (peg$silentFails === 0) { peg$fail(peg$c276); }
                                                                                }
                                                                                if (s1 === peg$FAILED) {
                                                                                  if (input.substr(peg$currPos, 5) === peg$c123) {
                                                                                    s1 = peg$c123;
                                                                                    peg$currPos += 5;
                                                                                  } else {
                                                                                    s1 = peg$FAILED;
                                                                                    if (peg$silentFails === 0) { peg$fail(peg$c124); }
                                                                                  }
                                                                                  if (s1 === peg$FAILED) {
                                                                                    if (input.substr(peg$currPos, 6) === peg$c166) {
                                                                                      s1 = peg$c166;
                                                                                      peg$currPos += 6;
                                                                                    } else {
                                                                                      s1 = peg$FAILED;
                                                                                      if (peg$silentFails === 0) { peg$fail(peg$c167); }
                                                                                    }
                                                                                    if (s1 === peg$FAILED) {
                                                                                      if (input.substr(peg$currPos, 8) === peg$c180) {
                                                                                        s1 = peg$c180;
                                                                                        peg$currPos += 8;
                                                                                      } else {
                                                                                        s1 = peg$FAILED;
                                                                                        if (peg$silentFails === 0) { peg$fail(peg$c181); }
                                                                                      }
                                                                                      if (s1 === peg$FAILED) {
                                                                                        if (input.substr(peg$currPos, 5) === peg$c277) {
                                                                                          s1 = peg$c277;
                                                                                          peg$currPos += 5;
                                                                                        } else {
                                                                                          s1 = peg$FAILED;
                                                                                          if (peg$silentFails === 0) { peg$fail(peg$c278); }
                                                                                        }
                                                                                        if (s1 === peg$FAILED) {
                                                                                          if (input.substr(peg$currPos, 6) === peg$c279) {
                                                                                            s1 = peg$c279;
                                                                                            peg$currPos += 6;
                                                                                          } else {
                                                                                            s1 = peg$FAILED;
                                                                                            if (peg$silentFails === 0) { peg$fail(peg$c280); }
                                                                                          }
                                                                                          if (s1 === peg$FAILED) {
                                                                                            if (input.substr(peg$currPos, 12) === peg$c174) {
                                                                                              s1 = peg$c174;
                                                                                              peg$currPos += 12;
                                                                                            } else {
                                                                                              s1 = peg$FAILED;
                                                                                              if (peg$silentFails === 0) { peg$fail(peg$c175); }
                                                                                            }
                                                                                            if (s1 === peg$FAILED) {
                                                                                              if (input.substr(peg$currPos, 4) === peg$c281) {
                                                                                                s1 = peg$c281;
                                                                                                peg$currPos += 4;
                                                                                              } else {
                                                                                                s1 = peg$FAILED;
                                                                                                if (peg$silentFails === 0) { peg$fail(peg$c282); }
                                                                                              }
                                                                                              if (s1 === peg$FAILED) {
                                                                                                if (input.substr(peg$currPos, 6) === peg$c283) {
                                                                                                  s1 = peg$c283;
                                                                                                  peg$currPos += 6;
                                                                                                } else {
                                                                                                  s1 = peg$FAILED;
                                                                                                  if (peg$silentFails === 0) { peg$fail(peg$c284); }
                                                                                                }
                                                                                                if (s1 === peg$FAILED) {
                                                                                                  if (input.substr(peg$currPos, 5) === peg$c285) {
                                                                                                    s1 = peg$c285;
                                                                                                    peg$currPos += 5;
                                                                                                  } else {
                                                                                                    s1 = peg$FAILED;
                                                                                                    if (peg$silentFails === 0) { peg$fail(peg$c286); }
                                                                                                  }
                                                                                                  if (s1 === peg$FAILED) {
                                                                                                    if (input.substr(peg$currPos, 9) === peg$c176) {
                                                                                                      s1 = peg$c176;
                                                                                                      peg$currPos += 9;
                                                                                                    } else {
                                                                                                      s1 = peg$FAILED;
                                                                                                      if (peg$silentFails === 0) { peg$fail(peg$c177); }
                                                                                                    }
                                                                                                    if (s1 === peg$FAILED) {
                                                                                                      if (input.substr(peg$currPos, 4) === peg$c287) {
                                                                                                        s1 = peg$c287;
                                                                                                        peg$currPos += 4;
                                                                                                      } else {
                                                                                                        s1 = peg$FAILED;
                                                                                                        if (peg$silentFails === 0) { peg$fail(peg$c288); }
                                                                                                      }
                                                                                                      if (s1 === peg$FAILED) {
                                                                                                        if (input.substr(peg$currPos, 3) === peg$c289) {
                                                                                                          s1 = peg$c289;
                                                                                                          peg$currPos += 3;
                                                                                                        } else {
                                                                                                          s1 = peg$FAILED;
                                                                                                          if (peg$silentFails === 0) { peg$fail(peg$c290); }
                                                                                                        }
                                                                                                        if (s1 === peg$FAILED) {
                                                                                                          if (input.substr(peg$currPos, 4) === peg$c291) {
                                                                                                            s1 = peg$c291;
                                                                                                            peg$currPos += 4;
                                                                                                          } else {
                                                                                                            s1 = peg$FAILED;
                                                                                                            if (peg$silentFails === 0) { peg$fail(peg$c292); }
                                                                                                          }
                                                                                                          if (s1 === peg$FAILED) {
                                                                                                            if (input.substr(peg$currPos, 8) === peg$c178) {
                                                                                                              s1 = peg$c178;
                                                                                                              peg$currPos += 8;
                                                                                                            } else {
                                                                                                              s1 = peg$FAILED;
                                                                                                              if (peg$silentFails === 0) { peg$fail(peg$c179); }
                                                                                                            }
                                                                                                            if (s1 === peg$FAILED) {
                                                                                                              if (input.substr(peg$currPos, 5) === peg$c293) {
                                                                                                                s1 = peg$c293;
                                                                                                                peg$currPos += 5;
                                                                                                              } else {
                                                                                                                s1 = peg$FAILED;
                                                                                                                if (peg$silentFails === 0) { peg$fail(peg$c294); }
                                                                                                              }
                                                                                                            }
                                                                                                          }
                                                                                                        }
                                                                                                      }
                                                                                                    }
                                                                                                  }
                                                                                                }
                                                                                              }
                                                                                            }
                                                                                          }
                                                                                        }
                                                                                      }
                                                                                    }
                                                                                  }
                                                                                }
                                                                              }
                                                                            }
                                                                          }
                                                                        }
                                                                      }
                                                                    }
                                                                  }
                                                                }
                                                              }
                                                            }
                                                          }
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parseLetterOrDigit();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseASSERT() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 6) === peg$c227) {
          s2 = peg$c227;
          peg$currPos += 6;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c228); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parseLetterOrDigit();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = void 0;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSpacing();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseBREAK() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 5) === peg$c229) {
          s2 = peg$c229;
          peg$currPos += 5;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c230); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parseLetterOrDigit();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = void 0;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSpacing();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseCASE() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 4) === peg$c231) {
          s2 = peg$c231;
          peg$currPos += 4;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c232); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parseLetterOrDigit();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = void 0;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSpacing();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseCATCH() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 5) === peg$c233) {
          s2 = peg$c233;
          peg$currPos += 5;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c234); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parseLetterOrDigit();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = void 0;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSpacing();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseCLASS() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 5) === peg$c235) {
          s2 = peg$c235;
          peg$currPos += 5;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c236); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parseLetterOrDigit();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = void 0;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSpacing();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseCONTINUE() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 8) === peg$c239) {
          s2 = peg$c239;
          peg$currPos += 8;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c240); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parseLetterOrDigit();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = void 0;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSpacing();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseDEFAULT() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 7) === peg$c241) {
          s2 = peg$c241;
          peg$currPos += 7;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c242); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parseLetterOrDigit();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = void 0;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSpacing();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseDO() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c243) {
          s2 = peg$c243;
          peg$currPos += 2;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c244); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parseLetterOrDigit();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = void 0;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSpacing();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseELSE() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 4) === peg$c245) {
          s2 = peg$c245;
          peg$currPos += 4;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c246); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parseLetterOrDigit();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = void 0;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSpacing();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseENUM() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 4) === peg$c247) {
          s2 = peg$c247;
          peg$currPos += 4;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c248); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parseLetterOrDigit();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = void 0;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSpacing();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseEXTENDS() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 7) === peg$c249) {
          s2 = peg$c249;
          peg$currPos += 7;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c250); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parseLetterOrDigit();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = void 0;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSpacing();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseFINALLY() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 7) === peg$c253) {
          s2 = peg$c253;
          peg$currPos += 7;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c254); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parseLetterOrDigit();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = void 0;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSpacing();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseFINAL() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 5) === peg$c170) {
          s2 = peg$c170;
          peg$currPos += 5;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c171); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parseLetterOrDigit();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = void 0;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSpacing();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseFOR() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 3) === peg$c255) {
          s2 = peg$c255;
          peg$currPos += 3;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c256); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parseLetterOrDigit();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = void 0;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSpacing();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseIF() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c259) {
          s2 = peg$c259;
          peg$currPos += 2;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c260); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parseLetterOrDigit();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = void 0;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSpacing();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseIMPLEMENTS() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 10) === peg$c261) {
          s2 = peg$c261;
          peg$currPos += 10;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c262); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parseLetterOrDigit();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = void 0;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSpacing();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseIMPORT() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 6) === peg$c263) {
          s2 = peg$c263;
          peg$currPos += 6;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c264); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parseLetterOrDigit();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = void 0;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSpacing();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseINTERFACE() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 9) === peg$c265) {
          s2 = peg$c265;
          peg$currPos += 9;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c266); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parseLetterOrDigit();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = void 0;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSpacing();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseINSTANCEOF() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 10) === peg$c267) {
          s2 = peg$c267;
          peg$currPos += 10;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c268); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parseLetterOrDigit();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = void 0;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSpacing();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseNEW() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 3) === peg$c269) {
          s2 = peg$c269;
          peg$currPos += 3;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c270); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parseLetterOrDigit();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = void 0;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSpacing();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsePACKAGE() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 7) === peg$c273) {
          s2 = peg$c273;
          peg$currPos += 7;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c274); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parseLetterOrDigit();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = void 0;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSpacing();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseRETURN() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 6) === peg$c275) {
          s2 = peg$c275;
          peg$currPos += 6;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c276); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parseLetterOrDigit();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = void 0;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSpacing();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseSTATIC() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 6) === peg$c166) {
          s2 = peg$c166;
          peg$currPos += 6;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c167); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parseLetterOrDigit();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = void 0;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSpacing();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseSUPER() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 5) === peg$c277) {
          s2 = peg$c277;
          peg$currPos += 5;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c278); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parseLetterOrDigit();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = void 0;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSpacing();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseSWITCH() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 6) === peg$c279) {
          s2 = peg$c279;
          peg$currPos += 6;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c280); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parseLetterOrDigit();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = void 0;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSpacing();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseSYNCHRONIZED() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 12) === peg$c174) {
          s2 = peg$c174;
          peg$currPos += 12;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c175); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parseLetterOrDigit();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = void 0;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSpacing();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseTHIS() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 4) === peg$c281) {
          s2 = peg$c281;
          peg$currPos += 4;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c282); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parseLetterOrDigit();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = void 0;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSpacing();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseTHROWS() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 6) === peg$c283) {
          s2 = peg$c283;
          peg$currPos += 6;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c284); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parseLetterOrDigit();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = void 0;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSpacing();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseTHROW() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 5) === peg$c285) {
          s2 = peg$c285;
          peg$currPos += 5;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c286); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parseLetterOrDigit();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = void 0;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSpacing();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseTRY() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 3) === peg$c289) {
          s2 = peg$c289;
          peg$currPos += 3;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c290); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parseLetterOrDigit();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = void 0;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSpacing();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseVOID() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 4) === peg$c291) {
          s2 = peg$c291;
          peg$currPos += 4;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c292); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parseLetterOrDigit();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = void 0;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSpacing();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseWHILE() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseIndent();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 5) === peg$c293) {
          s2 = peg$c293;
          peg$currPos += 5;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c294); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parseLetterOrDigit();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = void 0;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseSpacing();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseLiteral() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseEmptyLines();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseFloatLiteral();
        if (s2 === peg$FAILED) {
          s2 = peg$parseIntegerLiteral();
          if (s2 === peg$FAILED) {
            s2 = peg$parseCharLiteral();
            if (s2 === peg$FAILED) {
              s2 = peg$parseStringLiteral();
              if (s2 === peg$FAILED) {
                s2 = peg$currPos;
                if (input.substr(peg$currPos, 4) === peg$c287) {
                  s3 = peg$c287;
                  peg$currPos += 4;
                } else {
                  s3 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c288); }
                }
                if (s3 !== peg$FAILED) {
                  s4 = peg$currPos;
                  peg$silentFails++;
                  s5 = peg$parseLetterOrDigit();
                  peg$silentFails--;
                  if (s5 === peg$FAILED) {
                    s4 = void 0;
                  } else {
                    peg$currPos = s4;
                    s4 = peg$FAILED;
                  }
                  if (s4 !== peg$FAILED) {
                    peg$savedPos = s2;
                    s3 = peg$c295();
                    s2 = s3;
                  } else {
                    peg$currPos = s2;
                    s2 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s2;
                  s2 = peg$FAILED;
                }
                if (s2 === peg$FAILED) {
                  s2 = peg$currPos;
                  if (input.substr(peg$currPos, 5) === peg$c251) {
                    s3 = peg$c251;
                    peg$currPos += 5;
                  } else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c252); }
                  }
                  if (s3 !== peg$FAILED) {
                    s4 = peg$currPos;
                    peg$silentFails++;
                    s5 = peg$parseLetterOrDigit();
                    peg$silentFails--;
                    if (s5 === peg$FAILED) {
                      s4 = void 0;
                    } else {
                      peg$currPos = s4;
                      s4 = peg$FAILED;
                    }
                    if (s4 !== peg$FAILED) {
                      peg$savedPos = s2;
                      s3 = peg$c296();
                      s2 = s3;
                    } else {
                      peg$currPos = s2;
                      s2 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s2;
                    s2 = peg$FAILED;
                  }
                  if (s2 === peg$FAILED) {
                    s2 = peg$currPos;
                    if (input.substr(peg$currPos, 4) === peg$c271) {
                      s3 = peg$c271;
                      peg$currPos += 4;
                    } else {
                      s3 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c272); }
                    }
                    if (s3 !== peg$FAILED) {
                      s4 = peg$currPos;
                      peg$silentFails++;
                      s5 = peg$parseLetterOrDigit();
                      peg$silentFails--;
                      if (s5 === peg$FAILED) {
                        s4 = void 0;
                      } else {
                        peg$currPos = s4;
                        s4 = peg$FAILED;
                      }
                      if (s4 !== peg$FAILED) {
                        peg$savedPos = s2;
                        s3 = peg$c297();
                        s2 = s3;
                      } else {
                        peg$currPos = s2;
                        s2 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s2;
                      s2 = peg$FAILED;
                    }
                  }
                }
              }
            }
          }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseSpacing();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c298(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseIntegerLiteral() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseHexNumeral();
      if (s1 === peg$FAILED) {
        s1 = peg$parseBinaryNumeral();
        if (s1 === peg$FAILED) {
          s1 = peg$parseOctalNumeral();
          if (s1 === peg$FAILED) {
            s1 = peg$parseDecimalNumeral();
          }
        }
      }
      if (s1 !== peg$FAILED) {
        if (peg$c299.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c300); }
        }
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c301();
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseDecimalNumeral() {
      var s0, s1, s2, s3, s4, s5;

      if (input.charCodeAt(peg$currPos) === 48) {
        s0 = peg$c302;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c303); }
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (peg$c304.test(input.charAt(peg$currPos))) {
          s1 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c305); }
        }
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$currPos;
          s4 = [];
          if (peg$c306.test(input.charAt(peg$currPos))) {
            s5 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c307); }
          }
          while (s5 !== peg$FAILED) {
            s4.push(s5);
            if (peg$c306.test(input.charAt(peg$currPos))) {
              s5 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c307); }
            }
          }
          if (s4 !== peg$FAILED) {
            if (peg$c225.test(input.charAt(peg$currPos))) {
              s5 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c226); }
            }
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$currPos;
            s4 = [];
            if (peg$c306.test(input.charAt(peg$currPos))) {
              s5 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c307); }
            }
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              if (peg$c306.test(input.charAt(peg$currPos))) {
                s5 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s5 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c307); }
              }
            }
            if (s4 !== peg$FAILED) {
              if (peg$c225.test(input.charAt(peg$currPos))) {
                s5 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s5 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c226); }
              }
              if (s5 !== peg$FAILED) {
                s4 = [s4, s5];
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          }
          if (s2 !== peg$FAILED) {
            s1 = [s1, s2];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }

      return s0;
    }

    function peg$parseHexNumeral() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c308) {
        s1 = peg$c308;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c309); }
      }
      if (s1 === peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c310) {
          s1 = peg$c310;
          peg$currPos += 2;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c311); }
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseHexDigits();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseBinaryNumeral() {
      var s0, s1, s2, s3, s4, s5, s6;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c312) {
        s1 = peg$c312;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c313); }
      }
      if (s1 === peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c314) {
          s1 = peg$c314;
          peg$currPos += 2;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c315); }
        }
      }
      if (s1 !== peg$FAILED) {
        if (peg$c316.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c317); }
        }
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$currPos;
          s5 = [];
          if (peg$c306.test(input.charAt(peg$currPos))) {
            s6 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s6 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c307); }
          }
          while (s6 !== peg$FAILED) {
            s5.push(s6);
            if (peg$c306.test(input.charAt(peg$currPos))) {
              s6 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s6 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c307); }
            }
          }
          if (s5 !== peg$FAILED) {
            if (peg$c316.test(input.charAt(peg$currPos))) {
              s6 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s6 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c317); }
            }
            if (s6 !== peg$FAILED) {
              s5 = [s5, s6];
              s4 = s5;
            } else {
              peg$currPos = s4;
              s4 = peg$FAILED;
            }
          } else {
            peg$currPos = s4;
            s4 = peg$FAILED;
          }
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$currPos;
            s5 = [];
            if (peg$c306.test(input.charAt(peg$currPos))) {
              s6 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s6 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c307); }
            }
            while (s6 !== peg$FAILED) {
              s5.push(s6);
              if (peg$c306.test(input.charAt(peg$currPos))) {
                s6 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s6 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c307); }
              }
            }
            if (s5 !== peg$FAILED) {
              if (peg$c316.test(input.charAt(peg$currPos))) {
                s6 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s6 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c317); }
              }
              if (s6 !== peg$FAILED) {
                s5 = [s5, s6];
                s4 = s5;
              } else {
                peg$currPos = s4;
                s4 = peg$FAILED;
              }
            } else {
              peg$currPos = s4;
              s4 = peg$FAILED;
            }
          }
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseOctalNumeral() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 48) {
        s1 = peg$c302;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c303); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = [];
        if (peg$c306.test(input.charAt(peg$currPos))) {
          s5 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c307); }
        }
        while (s5 !== peg$FAILED) {
          s4.push(s5);
          if (peg$c306.test(input.charAt(peg$currPos))) {
            s5 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c307); }
          }
        }
        if (s4 !== peg$FAILED) {
          if (peg$c318.test(input.charAt(peg$currPos))) {
            s5 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c319); }
          }
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$currPos;
            s4 = [];
            if (peg$c306.test(input.charAt(peg$currPos))) {
              s5 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c307); }
            }
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              if (peg$c306.test(input.charAt(peg$currPos))) {
                s5 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s5 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c307); }
              }
            }
            if (s4 !== peg$FAILED) {
              if (peg$c318.test(input.charAt(peg$currPos))) {
                s5 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s5 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c319); }
              }
              if (s5 !== peg$FAILED) {
                s4 = [s4, s5];
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          }
        } else {
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseFloatLiteral() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parseHexFloat();
      if (s1 === peg$FAILED) {
        s1 = peg$parseDecimalFloat();
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c301();
      }
      s0 = s1;

      return s0;
    }

    function peg$parseDecimalFloat() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseDigits();
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 46) {
          s2 = peg$c320;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c321); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseDigits();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseExponent();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              if (peg$c322.test(input.charAt(peg$currPos))) {
                s5 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s5 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c323); }
              }
              if (s5 === peg$FAILED) {
                s5 = null;
              }
              if (s5 !== peg$FAILED) {
                s1 = [s1, s2, s3, s4, s5];
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 46) {
          s1 = peg$c320;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c321); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parseDigits();
          if (s2 !== peg$FAILED) {
            s3 = peg$parseExponent();
            if (s3 === peg$FAILED) {
              s3 = null;
            }
            if (s3 !== peg$FAILED) {
              if (peg$c322.test(input.charAt(peg$currPos))) {
                s4 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c323); }
              }
              if (s4 === peg$FAILED) {
                s4 = null;
              }
              if (s4 !== peg$FAILED) {
                s1 = [s1, s2, s3, s4];
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parseDigits();
          if (s1 !== peg$FAILED) {
            s2 = peg$parseExponent();
            if (s2 !== peg$FAILED) {
              if (peg$c322.test(input.charAt(peg$currPos))) {
                s3 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c323); }
              }
              if (s3 === peg$FAILED) {
                s3 = null;
              }
              if (s3 !== peg$FAILED) {
                s1 = [s1, s2, s3];
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parseDigits();
            if (s1 !== peg$FAILED) {
              s2 = peg$parseExponent();
              if (s2 === peg$FAILED) {
                s2 = null;
              }
              if (s2 !== peg$FAILED) {
                if (peg$c322.test(input.charAt(peg$currPos))) {
                  s3 = input.charAt(peg$currPos);
                  peg$currPos++;
                } else {
                  s3 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c323); }
                }
                if (s3 !== peg$FAILED) {
                  s1 = [s1, s2, s3];
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          }
        }
      }

      return s0;
    }

    function peg$parseExponent() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (peg$c324.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c325); }
      }
      if (s1 !== peg$FAILED) {
        if (peg$c326.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c327); }
        }
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseDigits();
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseHexFloat() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseHexSignificand();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseBinaryExponent();
        if (s2 !== peg$FAILED) {
          if (peg$c322.test(input.charAt(peg$currPos))) {
            s3 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c323); }
          }
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseHexSignificand() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c308) {
        s1 = peg$c308;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c309); }
      }
      if (s1 === peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c310) {
          s1 = peg$c310;
          peg$currPos += 2;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c311); }
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseHexDigits();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 46) {
            s3 = peg$c320;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c321); }
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseHexDigits();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseHexNumeral();
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 46) {
            s2 = peg$c320;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c321); }
          }
          if (s2 === peg$FAILED) {
            s2 = null;
          }
          if (s2 !== peg$FAILED) {
            s1 = [s1, s2];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }

      return s0;
    }

    function peg$parseBinaryExponent() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (peg$c328.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c329); }
      }
      if (s1 !== peg$FAILED) {
        if (peg$c326.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c327); }
        }
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseDigits();
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseDigits() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      if (peg$c225.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c226); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = [];
        if (peg$c306.test(input.charAt(peg$currPos))) {
          s5 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c307); }
        }
        while (s5 !== peg$FAILED) {
          s4.push(s5);
          if (peg$c306.test(input.charAt(peg$currPos))) {
            s5 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c307); }
          }
        }
        if (s4 !== peg$FAILED) {
          if (peg$c225.test(input.charAt(peg$currPos))) {
            s5 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c226); }
          }
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = [];
          if (peg$c306.test(input.charAt(peg$currPos))) {
            s5 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c307); }
          }
          while (s5 !== peg$FAILED) {
            s4.push(s5);
            if (peg$c306.test(input.charAt(peg$currPos))) {
              s5 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c307); }
            }
          }
          if (s4 !== peg$FAILED) {
            if (peg$c225.test(input.charAt(peg$currPos))) {
              s5 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c226); }
            }
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseHexDigits() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseHexDigit();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = [];
        if (peg$c306.test(input.charAt(peg$currPos))) {
          s5 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c307); }
        }
        while (s5 !== peg$FAILED) {
          s4.push(s5);
          if (peg$c306.test(input.charAt(peg$currPos))) {
            s5 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c307); }
          }
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parseHexDigit();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = [];
          if (peg$c306.test(input.charAt(peg$currPos))) {
            s5 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c307); }
          }
          while (s5 !== peg$FAILED) {
            s4.push(s5);
            if (peg$c306.test(input.charAt(peg$currPos))) {
              s5 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c307); }
            }
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parseHexDigit();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseHexDigit() {
      var s0;

      if (peg$c330.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c331); }
      }
      if (s0 === peg$FAILED) {
        if (peg$c332.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c333); }
        }
        if (s0 === peg$FAILED) {
          if (peg$c225.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c226); }
          }
        }
      }

      return s0;
    }

    function peg$parseCharLiteral() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 39) {
        s1 = peg$c334;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c335); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseEscape();
        if (s2 === peg$FAILED) {
          s2 = peg$currPos;
          s3 = peg$currPos;
          peg$silentFails++;
          if (peg$c336.test(input.charAt(peg$currPos))) {
            s4 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c337); }
          }
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = void 0;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parse_();
            if (s4 !== peg$FAILED) {
              s3 = [s3, s4];
              s2 = s3;
            } else {
              peg$currPos = s2;
              s2 = peg$FAILED;
            }
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 39) {
            s3 = peg$c334;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c335); }
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c338();
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseStringLiteral() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 34) {
        s1 = peg$c339;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c340); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseEscape();
        if (s3 === peg$FAILED) {
          s3 = peg$currPos;
          s4 = peg$currPos;
          peg$silentFails++;
          if (peg$c341.test(input.charAt(peg$currPos))) {
            s5 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c342); }
          }
          peg$silentFails--;
          if (s5 === peg$FAILED) {
            s4 = void 0;
          } else {
            peg$currPos = s4;
            s4 = peg$FAILED;
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parse_();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseEscape();
          if (s3 === peg$FAILED) {
            s3 = peg$currPos;
            s4 = peg$currPos;
            peg$silentFails++;
            if (peg$c341.test(input.charAt(peg$currPos))) {
              s5 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c342); }
            }
            peg$silentFails--;
            if (s5 === peg$FAILED) {
              s4 = void 0;
            } else {
              peg$currPos = s4;
              s4 = peg$FAILED;
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parse_();
              if (s5 !== peg$FAILED) {
                s4 = [s4, s5];
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          }
        }
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 34) {
            s3 = peg$c339;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c340); }
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c343();
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseEscape() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 92) {
        s1 = peg$c344;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c345); }
      }
      if (s1 !== peg$FAILED) {
        if (peg$c346.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c347); }
        }
        if (s2 === peg$FAILED) {
          s2 = peg$parseOctalEscape();
          if (s2 === peg$FAILED) {
            s2 = peg$parseUnicodeEscape();
          }
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseOctalEscape() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (peg$c348.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c349); }
      }
      if (s1 !== peg$FAILED) {
        if (peg$c318.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c319); }
        }
        if (s2 !== peg$FAILED) {
          if (peg$c318.test(input.charAt(peg$currPos))) {
            s3 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c319); }
          }
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (peg$c318.test(input.charAt(peg$currPos))) {
          s1 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c319); }
        }
        if (s1 !== peg$FAILED) {
          if (peg$c318.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c319); }
          }
          if (s2 !== peg$FAILED) {
            s1 = [s1, s2];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
          if (peg$c318.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c319); }
          }
        }
      }

      return s0;
    }

    function peg$parseUnicodeEscape() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = [];
      if (input.charCodeAt(peg$currPos) === 117) {
        s2 = peg$c350;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c351); }
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          if (input.charCodeAt(peg$currPos) === 117) {
            s2 = peg$c350;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c351); }
          }
        }
      } else {
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseHexDigit();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseHexDigit();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseHexDigit();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseHexDigit();
              if (s5 !== peg$FAILED) {
                s1 = [s1, s2, s3, s4, s5];
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseAT() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 64) {
        s1 = peg$c352;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c353); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseAND() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 38) {
        s1 = peg$c354;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c355); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        if (peg$c356.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c357); }
        }
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseSpacing();
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseANDAND() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c358) {
        s1 = peg$c358;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c359); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseANDEQU() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c360) {
        s1 = peg$c360;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c361); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseBANG() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 33) {
        s1 = peg$c362;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c363); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        if (input.charCodeAt(peg$currPos) === 61) {
          s3 = peg$c364;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c365); }
        }
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseSpacing();
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseBSR() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 3) === peg$c366) {
        s1 = peg$c366;
        peg$currPos += 3;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c367); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        if (input.charCodeAt(peg$currPos) === 61) {
          s3 = peg$c364;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c365); }
        }
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseSpacing();
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseBSREQU() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 4) === peg$c368) {
        s1 = peg$c368;
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c369); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseCOLON() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 58) {
        s1 = peg$c370;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c371); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        if (input.charCodeAt(peg$currPos) === 58) {
          s3 = peg$c370;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c371); }
        }
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseSpacing();
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseCOLONCOLON() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c372) {
        s1 = peg$c372;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c373); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseCOMMA() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 44) {
        s1 = peg$c374;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c375); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseDEC() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c376) {
        s1 = peg$c376;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c377); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseDIV() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 47) {
        s1 = peg$c211;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c212); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        if (input.charCodeAt(peg$currPos) === 61) {
          s3 = peg$c364;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c365); }
        }
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseSpacing();
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseDIVEQU() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c378) {
        s1 = peg$c378;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c379); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseDOT() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseEmptyLines();
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 46) {
          s2 = peg$c320;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c321); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseSpacing();
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseELLIPSIS() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 3) === peg$c380) {
        s1 = peg$c380;
        peg$currPos += 3;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c381); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseEQU() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 61) {
        s1 = peg$c364;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c365); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        if (input.charCodeAt(peg$currPos) === 61) {
          s3 = peg$c364;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c365); }
        }
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseSpacing();
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseEQUAL() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c382) {
        s1 = peg$c382;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c383); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseGE() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c384) {
        s1 = peg$c384;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c385); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseGT() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 62) {
        s1 = peg$c386;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c387); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        if (peg$c388.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c389); }
        }
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseSpacing();
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseHAT() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 94) {
        s1 = peg$c390;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c391); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        if (input.charCodeAt(peg$currPos) === 61) {
          s3 = peg$c364;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c365); }
        }
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseSpacing();
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseHATEQU() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c392) {
        s1 = peg$c392;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c393); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseINC() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c394) {
        s1 = peg$c394;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c395); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseLBRK() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 91) {
        s1 = peg$c396;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c397); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseLE() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c398) {
        s1 = peg$c398;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c399); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseLPAR() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 40) {
        s1 = peg$c400;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c401); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseLPOINT() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 60) {
        s1 = peg$c402;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c403); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseLT() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 60) {
        s1 = peg$c402;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c403); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        if (peg$c404.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c405); }
        }
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseSpacing();
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseLWING() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 123) {
        s1 = peg$c406;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c407); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseMINUS() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 45) {
        s1 = peg$c408;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c409); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        if (peg$c410.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c411); }
        }
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseSpacing();
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseMINUSEQU() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c412) {
        s1 = peg$c412;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c413); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseMOD() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 37) {
        s1 = peg$c414;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c415); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        if (input.charCodeAt(peg$currPos) === 61) {
          s3 = peg$c364;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c365); }
        }
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseSpacing();
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseMODEQU() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c416) {
        s1 = peg$c416;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c417); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseNOTEQUAL() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c418) {
        s1 = peg$c418;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c419); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseOR() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 124) {
        s1 = peg$c420;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c421); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        if (peg$c422.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c423); }
        }
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseSpacing();
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseOREQU() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c424) {
        s1 = peg$c424;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c425); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseOROR() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c426) {
        s1 = peg$c426;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c427); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsePLUS() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 43) {
        s1 = peg$c428;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c429); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        if (peg$c430.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c431); }
        }
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseSpacing();
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsePLUSEQU() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c432) {
        s1 = peg$c432;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c433); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsePOINTER() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c434) {
        s1 = peg$c434;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c435); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseQUERY() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 63) {
        s1 = peg$c436;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c437); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseRBRK() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 93) {
        s1 = peg$c438;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c439); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseRPAR() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 41) {
        s1 = peg$c440;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c441); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseRPOINT() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 62) {
        s1 = peg$c386;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c387); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseRWING() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 125) {
        s1 = peg$c442;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c443); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseSEMI() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 59) {
        s1 = peg$c444;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c445); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseSL() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c446) {
        s1 = peg$c446;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c447); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        if (input.charCodeAt(peg$currPos) === 61) {
          s3 = peg$c364;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c365); }
        }
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseSpacing();
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseSLEQU() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 3) === peg$c448) {
        s1 = peg$c448;
        peg$currPos += 3;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c449); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseSR() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c450) {
        s1 = peg$c450;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c451); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        if (peg$c388.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c389); }
        }
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseSpacing();
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseSREQU() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 3) === peg$c452) {
        s1 = peg$c452;
        peg$currPos += 3;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c453); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseSTAR() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 42) {
        s1 = peg$c209;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c210); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        if (input.charCodeAt(peg$currPos) === 61) {
          s3 = peg$c364;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c365); }
        }
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseSpacing();
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseSTAREQU() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c454) {
        s1 = peg$c454;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c455); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseTILDA() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 126) {
        s1 = peg$c456;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c457); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSpacing();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseEOT() {
      var s0, s1;

      s0 = peg$currPos;
      peg$silentFails++;
      s1 = peg$parse_();
      peg$silentFails--;
      if (s1 === peg$FAILED) {
        s0 = void 0;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parse_() {
      var s0;

      if (input.length > peg$currPos) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c458); }
      }

      return s0;
    }


        function extractOptional(optional, index, def) {
          def = typeof def !== 'undefined' ?  def : null;
          return optional ? optional[index] : def;
        }
      
        function extractList(list, index) {
          var result = new Array(list.length), i;
      
          for (i = 0; i < list.length; i++) {
            result[i] = list[i][index];
          }
      
          return result;
        }
      
        function buildList(first, rest, index) {
          return [first].concat(extractList(rest, index));
        }
      
        function buildTree(first, rest, builder) {
          var result = first, i;
      
          for (i = 0; i < rest.length; i++) {
            result = builder(result, rest[i]);
          }
      
          return result;
        }
      
        function buildInfixExpr(first, rest) {
          return buildTree(first, rest, function(result, element) {
            return {
              node:        'InfixExpression',
              operator:     element[0][0], // remove ending Spacing
              leftOperand:  result,
              rightOperand: element[1],
              location: location()
            };
          });
        }
      
        function buildQualified(first, rest, index) {
          return buildTree(first, rest, 
            function(result, element) {
              return {
                node:     'QualifiedName',
                qualifier: result,
                name:      element[index],
                location: location()
              };
            }
          );
        }
      
        function popQualified(tree) {
          return tree.node === 'QualifiedName' 
            ? { name: tree.name, expression: tree.qualifier }
            : { name: tree, expression: null };
        }
      
        function extractThrowsClassType(list) {
          return list.map(function(node){ 
            return node.name; 
          });
        }
      
        function extractExpressions(list) {
          return list.map(function(node) { 
            return node.expression; 
          });
        }
      
        function buildArrayTree(first, rest) {
          return buildTree(first, rest, 
            function(result, element) {
            return {
              node:         'ArrayType',
              componentType: result
            }; 
          });
        }
      
        function optionalList(value) {
          return value !== null ? value : [];
        }
      
        function extractOptionalList(list, index) {
          return optionalList(extractOptional(list, index));
        }
      
        function skipNulls(list) {
          return list.filter(function(v){ return v !== null; });
        }
      
        function makePrimitive(code) {
          return {
            node:             'PrimitiveType',
            primitiveTypeCode: code
          }
        }
      
        function makeModifier(keyword) {
          return { 
            node:   'Modifier', 
            keyword: keyword
          };
        }
      
        function makeCatchFinally(catchClauses, finallyBlock) {
            return { 
              catchClauses: catchClauses, 
              finally:      finallyBlock 
            };
        }
      
        function buildTypeName(qual, args, rest) {
          var first = args === null ? {
            node: 'SimpleType',
            name:  qual
          } : {
            node: 'ParameterizedType',
            type:  {
                node: 'SimpleType',
                name:  qual
            },
            typeArguments: args
          };
      
          return buildTree(first, rest, 
            function(result, element) {
              var args = element[2];
              return args === null ? {
                node:     'QualifiedType',
                name:      element[1],
                qualifier: result
              } :
              {
                node: 'ParameterizedType',
                type:  {
                  node:     'QualifiedType',
                  name:      element[1],
                  qualifier: result
                },
                typeArguments: args
              };
            }
          );
        }
      
        function mergeProps(obj, props) {
          var key;
          for (key in props) {
            if (props.hasOwnProperty(key)) {
              if (obj.hasOwnProperty(key)) {
                throw new JavaError(
                  'Property ' + key + ' exists ' + '\n' +  
                  '\nCurrent value: ' + JSON.stringify(obj[key], null, 2) + 
                  '\nNew value: ' + JSON.stringify(props[key], null, 2)
                );
              } else {
                obj[key] = props[key];
              }
            }
          }
          return obj;
        }
      
        function buildSelectorTree(arg, sel, sels) {
          function getMergeVal(o,v) {
            switch(o.node){
              case 'SuperFieldAccess':
              case 'SuperMethodInvocation':
                return { qualifier: v };
              case 'ArrayAccess':
                return { array: v };
              default:
                return { expression: v };
            }
          }
          return buildTree(mergeProps(sel, getMergeVal(sel, arg)), 
            sels, function(result, element) {
              return mergeProps(element, getMergeVal(element, result));
          });
        }
      
        function leadingComments(comments) {
          const leadComments = [];
      
          for(var i = 0; i < comments.length; i++) {
            leadComments.push({
              ast_type: "comment",
              value: comments[i].value,
              leading: true,
              trailing: false,
              printed: false
            });
          }
      
          return leadComments;
        }
      
        function TODO() {
          throw new JavaError('TODO: not impl line ' + '\n' + text());
        }
      

    peg$result = peg$startRuleFunction();

    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
      return peg$result;
    } else {
      if (peg$result !== peg$FAILED && peg$currPos < input.length) {
        peg$fail(peg$endExpectation());
      }

      throw peg$buildStructuredError(
        peg$maxFailExpected,
        peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
        peg$maxFailPos < input.length
          ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
          : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
      );
    }
  }

  return {
    SyntaxError: peg$SyntaxError,
    parse:       peg$parse
  };
})();
