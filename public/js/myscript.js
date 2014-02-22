$(document).ready(function(){

	function generateCode(){
		var val = "function myScript(){" +
			"\n\treturn 100;" +
			"\n}";				
		return val;
	}

	var data = new FormData();
	data.append("thing", "thing");
	console.log(data);

	var myCodeMirror = CodeMirror(document.getElementById("editor"), {
		value: generateCode(),
		lineNumbers: true,
		matchBrackets: true,
		mode:  "javascript"
	});
});