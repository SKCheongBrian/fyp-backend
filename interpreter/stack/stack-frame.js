class StackFrame {
  functionName;
  frame;

  constructor(name) {
    this.functionName = name;
    this.frame = {};
  }

  getVariable(symbol) {
    if (this.frame.hasOwnProperty(symbol)) {
      return this.frame[symbol]
    }
    return null;
  }

  setVariable(symbol, newValue) {
    // ! This may be wrong
    // does not check if variable has been declared yet
    this.frame[symbol] = newValue;
  }

}

export default StackFrame;