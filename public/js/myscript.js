var myCodeMirror;

$(document).ready(function(){

	function generateCode(){
		local_data = local_data.slice(1,local_data.length - 1);
		local_data = local_data.replace(/&quot;/g,"'");
		return local_data;
	}

	myCodeMirror = CodeMirror(document.getElementById("editor"), {
		value: generateCode(),
		lineNumbers: true,
		matchBrackets: true,
		mode:  "javascript"
	});

	myCodeMirror.on("change", function(cm, change) {
		switch(change.origin){
			case "paste":
				console.log("Pasted");
				console.log(change.from);
				console.log(change.from.line);
				console.log(change.text[0]);
				break;
			case "cut":
				console.log("cut");
				break;
			case "+input":
				console.log("input");
				console.log(change.from);
				console.log(change.text[0]);
				break;
			case "+delete":
				console.log("delete");
				break;
			default:
				break;
		}
	});
});