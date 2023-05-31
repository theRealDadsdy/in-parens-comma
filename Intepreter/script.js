var input,output,vars,flag,go;
function stop(){
  go = false;
  runButton.innerText = "Run";
  runButton.onclick = run;
}
async function run(){
  output = "";
  input = stdin.value.split('').map(val => val.charCodeAt(0));
  vars = [];
  flag = flags.value.split(' ');
  stderr.innerText = "";
  stdout.innerText = "";
  if (code.value.length == 0){
    stderr.innerText = "code must not be blank";
    return;
  }
  if (code.value[0] != '(' || code.value[code.value.length - 1] != ')'){
    stderr.innerText = "code must be surrounded by parentheses";
    return;
  }
  runButton.innerText = "Stop";
  runButton.onclick = stop;
  go = true;
  let retVal = await evaluate(code.value);
  runButton.innerText = "Run";
  runButton.onclick = run;
  if (flag.includes("d")) output += retVal;
  stdout.textContent = output.split('\n').join('\r\n');
}
async function evaluate(code, layer=1){
  let parens = matchParens(code);
  if (code.length == 0){
    return -1;
  }
  if (flag.includes("D")) output += Array(layer).join("  ") + "Running " + code + "\n";
  let base = code;
  let retVal = 0;
  if (parens[0][1] == code.length){
    code = code.slice(1,code.length-1);
    parens.shift();
    code = code.split(',');
    let newCode = [];
    let last = "";
    for (part of code){
      if (last.split("(").length == last.split(")").length){
        last = part;
        newCode.push(part);
      }
      else{
        last += "," + part;
        newCode[newCode.length - 1] = last;
      }
    }
    code = pad(newCode, 6, '');
    let cond = await evaluate(code[4],layer+1) >= await evaluate(code[5],layer+1) && go;
    while (cond) {
      let varIndex = await evaluate(code[0],layer+1);
      let varSet = await evaluate(code[1],layer+1);
      let intOutput = await evaluate(code[2],layer+1);
      let strOutput = await evaluate(code[3],layer+1);
      if (varIndex > vars.length){
        vars = pad(vars, varIndex, 0)
      }
      if (varIndex == -1){
        retVal += 1;
      }
      else if (varIndex == 0){
        retVal += input.length ? input.shift() : 0
      }
      else{
        retVal += vars[varIndex - 1];
        if (varSet != -1){
          vars[varIndex - 1] = varSet;
        }
      }
      if (intOutput != -1){
        output += intOutput + "\n";
      }
      if (strOutput != -1){
        output += String.fromCharCode(strOutput);
      }
      stdout.textContent = output.split('\n').join('\r\n');
      cond = await evaluate(code[4],layer+1) > await evaluate(code[5],layer+1) && go;
      if (cond){
        await sleep(10);
      }
    }
  }
  else{
    let val1 = await evaluate(code.slice(0,parens[0][1]),layer+1);
    let val2 = await evaluate(code.slice(parens[0][1]),layer+1);
    retVal = val1 + val2;
  }
  if (flag.includes("D")) output += Array(layer).join("  ") + base + "=" + retVal + "\n";
  stdout.textContent = output.split('\n').join('\r\n');
  return retVal;
}
function matchParens(string){
  let toMatch = [];
  let matches = [];
  for (let i = 0; i < string.length; i++){
    if (string[i] == '('){
      toMatch.push(i);
    }
    if (string[i] == ')'){
      matches.push([toMatch.pop(), i+1]);
    }
  }
  matches.sort((a, b) => a[0] - b[0]);
  return matches;
}
function pad(array, length, fill){
  return length > array.length ? array.concat(Array(length - array.length).fill(fill)) : array; 
}
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}