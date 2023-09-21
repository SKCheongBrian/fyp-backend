class Scope {
  children;
  parent;
  isStatic;

  constructor(parent, isStatic) {
    this.children = {};
    this.parent = parent;
    this.isStatic = isStatic;
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

  isStatic() {
    return this.isStatic;
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
  constructor(name, parent, isStatic) {
    super(parent, isStatic);
    this.name = name;
    this.fields = {};
  }

  getName() {
    return this.name;
  }

  addField(field) {
    this.fields[field.getId()] = field;
  }

  addSuperScope(superClass) {
    this.superClass = superClass;
  }

  isClassScope() {
    return true;
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
  constructor(name, parent, isStatic) {
    super(parent, isStatic);
    this.name = name;
    this.variables = {};
  }

  getName() {
    return this.name;
  }

  addVariable(variable) {
    this.variables[variable.getId()] = variable;
  }

  isClassScope() {
    return false;
  }
}

class DummyScope extends Scope {
  constructor() {
    super(null, false);
  }
}

export {
  Field,
  ClassScope,
  Variable,
  MethodScope,
  DummyScope
}
