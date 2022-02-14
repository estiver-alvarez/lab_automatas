function colorStates(states, cssClass) {
  if (states === undefined || states === null) {
    return;
  }

  states = getElementsOfStates(states);

  for (var i=0; i<states.length; i++) {
    states[i].children("ellipse").each(function() {
      $(this).attr("class", cssClass);
    });
  }
}

function colorDiv(divId, intervals, cssClass) {
  var regex = $("#" + divId).html();

  var start = 0;
  var out = "";

  for (var i=0; i<intervals.length; i++) {
    out += regex.slice(start, intervals[i][0]);
    out += '<font class="' + cssClass + '">' + regex.slice(intervals[i][0], intervals[i][1]) + '</font>';
    start = intervals[i][1];
  }

  out += regex.slice(start);

  $("#" + divId).html(out);
}

function getElementsOfStates(states) {
  var retVal = [];

  for (var i=0; i<states.length; i++) {
    $("title:contains('" + states[i].toString() + "')").each(function(index, element)  {
      if ($(this).text() === states[i].toString()) {
        retVal.push($(this).parent());
      }
    });
  }

  return retVal;
}

function reordernarEstadosAceptacion(states) {
  var stateElements = getElementsOfStates(states);

  for (var i=0; i<stateElements.length; i++) {
    var e1 = $(stateElements[i].children("ellipse")[0]);
    var e2 = $(stateElements[i].children("ellipse")[1]);
    e1.insertAfter(e2);
  }
}

function dibujarGrafo() {

  // se obtiene la representacion del automata en formato plano mediante la api
  var dotString = noam.fsm.printDotFormat(automaton);

  //se obtiene la imagen del automata en formato svg
  var gvizXml = Viz(dotString, "svg");

  // se imprime la imagen
  $("#automatonGraph").html(gvizXml);
  reordernarEstadosAceptacion(automaton.acceptingStates);
  //luego de obtener los estados de aceptacion se redimencionan
  $("#automatonGraph svg").width($("#automatonGraph").width());
}

function colorize() {
  colorStates(automaton.states, "inactiveStates");
  colorStates(previousStates, "previousState");
  colorStates(nextStates, "nextState");
  colorStates(currentStates, "currentState");
}

$("#generateRandomString").click(function(){
  if ($("#startStop").text() === "Parar el recorrido") {
    $("#startStop").click();
  }

  $("#inputString").val(Math.random() >= 0.5 ?
    noam.fsm.randomStringInLanguage(automaton).join("") :
    noam.fsm.randomStringNotInLanguage(automaton).join(""));
  onInputStringChange();
});

$("#generateRandomAcceptableString").click(function(){
  if ($("#startStop").text() === "Parar el recorrido") {
    $("#startStop").click();
  }

  var s = noam.fsm.randomStringInLanguage(automaton).join("");
  $("#inputString").val(s);
  onInputStringChange();
});

$("#generateRandomUnacceptableString").click(function(){
  if ($("#startStop").text() === "Parar el recorrido") {
    $("#startStop").click();
  }

  var s = noam.fsm.randomStringNotInLanguage(automaton).join("");
  $("#inputString").val(s);
  onInputStringChange();
});

$("#startStop").click(function() {
  if ($("#startStop").text() === "Empezar a recorrer la hilera") {
    var r = $("#inputString").val();
    $("#inputString").parent().html('<div id="inputString" type="text" class="input-div input-block-level monospaceRegex" placeholder="Escriba su hilera o de clic para generar un ejemplo"><br></div>');
    $("#inputString").html(r === "" ? '<br>' : r);
    resetAutomaton();
    $("#inputString").removeAttr("contenteditable");
    $("#inputFirst").attr("disabled", false);
    $("#inputNext").attr("disabled", false);
    $("#inputPrevious").attr("disabled", false);
    $("#inputLast").attr("disabled", false);
    $("#startStop").text("Parar el recorrido");
  } else {
    var r = $("#inputString").text();
    $("#inputString").parent().html('<input id="inputString" type="text" class="input-block-level monospaceRegex" placeholder="Escriba su hilera o de clic para generar un ejemplo">');
    $("#inputString").keyup(onInputStringChange);
    $("#inputString").change(onInputStringChange);
    $("#inputString").val(r);
    $("#inputString").attr("contenteditable", "");
    $("#inputFirst").attr("disabled", true);
    $("#inputNext").attr("disabled", true);
    $("#inputPrevious").attr("disabled", true);
    $("#inputLast").attr("disabled", true);
    $("#startStop").text("Empezar a recorrer la hilera");
    $("#inputString").html(($("#inputString").text()));
    $("#inputString").focus();
  }
});

function onInputStringChange() {
  var chars = $("#inputString").val().split("");
  var isValidInputString = -1;
  for (var i=0; i<chars.length; i++) {
    if (!noam.util.contains(automaton.alphabet, chars[i])) {
      isValidInputString = i;
      break;
    }
  }

  if (isValidInputString === -1) {
    $("#startStop").attr("disabled", false);
    $("#inputString").parent().addClass("success");
    $("#inputString").parent().removeClass("error");
    $("#inputError").hide();
  } else {
    $("#startStop").attr("disabled", true);
    $("#inputString").parent().removeClass("success");
    $("#inputString").parent().addClass("error");
    $("#inputError").show();
    $("#inputError").text("Error: El símbolo ingresado en la hilera en la posición " + i + " no se encuentra en el alphabet del automata.");
  }
}

function colorNextSymbol() {
  $("#inputString").html(inputString);

  if ($("#inputString").html() === "") {
    $("#inputString").html("<br>");
  }

  if (nextSymbolIndex < inputString.length) {
    colorDiv("inputString", [[nextSymbolIndex, nextSymbolIndex+1]], "nextSymbol");
  }
}

function resetAutomaton() {
  currentStates = noam.fsm.computeEpsilonClosure(automaton, [automaton.initialState]);
  inputString = $("#inputString").text();
  nextSymbolIndex = 0;
  colorize();
  colorNextSymbol();
}

$("#inputFirst").click(function(){
  resetAutomaton();
});

$("#inputPrevious").click(function(){
  if (nextSymbolIndex > 0) {
    currentStates = noam.fsm.readString(automaton, inputString.substring(0, nextSymbolIndex-1).split(""));
    nextSymbolIndex = nextSymbolIndex-1;
    colorize();
    colorNextSymbol();
  }
});

$("#inputNext").click(function(){
  if (nextSymbolIndex < inputString.length) {
    currentStates = noam.fsm.makeTransition(automaton, currentStates, inputString[nextSymbolIndex]);
    nextSymbolIndex += 1;
    colorize();
    colorNextSymbol();
  }
});

$("#inputLast").click(function(){
  while(nextSymbolIndex < inputString.length) {
    currentStates = noam.fsm.makeTransition(automaton, currentStates, inputString[nextSymbolIndex]);
    nextSymbolIndex += 1;
    colorize();
    colorNextSymbol();
  }
});

function inicializar() {
  inputStringLeft = null;
  currentStates = null;
  inactiveStates = null;
  previousStates = null;
  nextStates = null;
}

var regex = null;
var automaton = null;
var inputString = null;
var nextSymbolIndex = 0;
var currentStates = null;
var inactiveStates = null;
var previousStates = null;
var nextStates = null;
var inputIsRegex = false;




function generateAutomaton(fsmType) {
  //se le pide a la api que genere aleatoriamente el formato de un automata con 3 simbolos de vocabulario
  // y hasta 4 estados y 3 estados de aceptacion respectivamente
  automaton = noam.fsm.createRandomFsm(fsmType, 4, 3, 3);
  $("#fsm").val(noam.fsm.serializeFsmToString(automaton));
  $("#fsm").scrollTop(0);
  $("#fsm").focus();
  onAutomatonChange();
}

$("#generateDFA").click(function() {
  //se genera aleatoriamente un automa deterministico
  generateAutomaton(noam.fsm.dfaType);
  $("#createAutomaton").attr("disabled", false);
});

$("#generateNFA").click(function() {
  //se genera aleatoriamente un automa no deterministico
  generateAutomaton(noam.fsm.nfaType);
  $("#createAutomaton").attr("disabled", false);
});



$("#createAutomaton").click(function() {
  // se le pasa al api en formato plano un automata

  automaton = noam.fsm.parseFsmFromString($("#fsm").val());
  type = noam.fsm.determineType(automaton);

  if ( type == "NFA"){

    // si el automata ingresado es no deterministico entonces se convierte a deterministico
    automaton = noam.fsm.convertNfaToDfa(automaton);

  }

  // se minimiza el automata
  automaton = noam.fsm.minimize(automaton);
  


  inicializar();
  dibujarGrafo();
  resetAutomaton();

  $("#generateRandomString").attr("disabled", false);
  $("#generateRandomAcceptableString").attr("disabled", false);
  $("#generateRandomUnacceptableString").attr("disabled", false);
  $("#inputString").attr("disabled", false);
});


$("#fsm").change(onAutomatonChange);
$("#fsm").keyup(onAutomatonChange);

function onAutomatonChange() {
  //metodo on change que valida que el formato del automata este correcto
  $("#automatonGraph").html("");
  $("#inputString").html("<br>");

  $("#generateRandomString").attr("disabled", true);
  $("#generateRandomAcceptableString").attr("disabled", true);
  $("#generateRandomUnacceptableString").attr("disabled", true);
  $("#createAutomaton").attr("disabled", true);
  $("#startStop").attr("disabled", true);
  $("#inputFirst").attr("disabled", true);
  $("#inputNext").attr("disabled", true);
  $("#inputPrevious").attr("disabled", true);
  $("#inputLast").attr("disabled", true);
  $("#inputString").parent().html('<input id="inputString" type="text" class="input-block-level monospaceRegex" placeholder="Escriba su hilera o de clic para generar un ejemplo" disabled>');
  $("#inputString").parent().removeClass("success error");
  $("#inputString").keyup(onInputStringChange);
  $("#inputString").change(onInputStringChange);
  $("#startStop").text("Empezar a recorrer la hilera");
  $("#inputError").hide();


    validarFsm();
}

function validarFsm() {
  var fsm = $("#fsm").val();

  if (fsm.length === 0) {
    $("#fsm").parent().removeClass("success error");
    $("#fsmError").hide();
  } else {
    try {
      noam.fsm.parseFsmFromString(fsm);
      $("#fsm").parent().removeClass("error");
      $("#fsm").parent().addClass("success");
      $("#createAutomaton").attr("disabled", false);
      $("#fsmError").hide();
    } catch (e) {
      $("#fsm").parent().removeClass("success");
      $("#fsm").parent().addClass("error");
      $("#fsmError").text("Error " + e.message);
      $("#fsmError").show();
    }
  }
}

