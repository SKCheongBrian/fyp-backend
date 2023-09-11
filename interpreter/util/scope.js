class Scope {
  children;
  parent;

  constructor(parent) {
    this.children = {};
    this.parent = parent;
  }

  getChildren() {
    return this.children;
  }

  addChild(child) {
    this.children[child.name] = child;
  }

  getParent() {
    return this.parent;
  }
}

class Field {
  name;
  isStatic;

  constructor(id, isStatic) {
    this.name = id;
    this.isStatic = isStatic;
  }

  getId() {
    return this.name;
  }

  isStatic() {
    return this.isStatic;
  }
}

class ClassScope extends Scope {
  name;
  fields;
  superClass;
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

  addSuperScope(superClass) {
    this.superClass = superClass;
  }
}

class Variable {
  name;

  constructor(id) {
    this.name = id;
  }

  getId() {
    return this.name;
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
