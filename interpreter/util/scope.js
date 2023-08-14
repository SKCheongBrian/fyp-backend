class Scope {
  children;
  parent;

  constructor(parent) {
    this.children = [];
    this.parent = parent;
  }

  getChildren() {
    return this.children;
  }

  addChild(child) {
    this.children.push(child);
  }

  getParent() {
    return this.parent;
  }
}

class Field {
  id;
  isStatic;

  constructor(id, isStatic) {
    this.id = id;
    this.isStatic = isStatic;
  }

  getId() {
    return this.id;
  }

  isStatic() {
    return this.isStatic;
  }
}

class ClassScope extends Scope {
  name;
  fields;
  constructor(name, parent) {
    super(parent);
    this.name = name;
    this.fields = [];
  }

  getName() {
    return this.name;
  }

  addField(field) {
    this.fields.push(field);
  }
}

class Variable {
  id;
  constructor(id) {
    this.id = id;
  }

  getId() {
    return this.id;
  }

}

class MethodScope extends Scope {
  name;
  variables;
  constructor(name, parent) {
    super(parent);
    this.name = name;
    this.variables = [];
  }

  getName() {
    return this.name;
  }

  addVariable(variable) {
    this.variables.push(variable);
  }
}

class DummyScope extends Scope {
  constructor() {
    super(null);
  }
}

export {
  Field,
  ClassScope,
  Variable,
  MethodScope,
  DummyScope
}
