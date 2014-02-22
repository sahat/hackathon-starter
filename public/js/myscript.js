$(document).ready(function(){

	function generateCode(){
		var val = "function myScript(){" +
			"\n\treturn 100;" +
			"\n}";				
		return val;
	}

	var myCodeMirror = CodeMirror(document.getElementById("editor"), {
		value: generateCode(),
		lineNumbers: true,
		matchBrackets: true,
		mode:  "javascript"
	});
});