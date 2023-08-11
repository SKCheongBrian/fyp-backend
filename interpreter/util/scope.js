class Scope {
  #children;
  #parent;

  constructor(parent) {
    this.children = [];
    this.parent = parent;
  }

  get getChildren() {
    return this.#children;
  }

  addChild(child) {
    this.#children.push(child);
  }

  get getParent() {
    return this.parent;
  }
}

class ClassScope extends Scope {

}

class MethodScope extends Scope {

}
