$(document).ready(function(){

	function generateCode(){
		local_data = local_data.slice(1,local_data.length - 1);
		local_data = local_data.replace(/&quot;/g,"'");
		return local_data;
	}

	console.log(document.getElementById("editor"));
	var myCodeMirror = CodeMirror(document.getElementById("editor"), {
		value: generateCode(),
		lineNumbers: true,
		matchBrackets: true,
		mode:  "javascript"
	});
});