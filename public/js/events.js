

// variables
var xhr;
var formData;
var dropTitle;

// Handle on drop area
// var dropArea
var list = [];
var totalSize = 0;
var fileN;


$(function(){ 
    dropArea  = $('#drop_area');
    dropTitle = $('#drop_area_title');

    console.log(dropArea);
    console.log(dropTitle);

    function dragenter(event) {
        event.preventDefault();
        event.stopPropagation();
        dropTitle.typer();
    }
    function dragover(event) {
        event.preventDefault();
        event.stopPropagation();
        dropArea.css('box-shadow','0 0 100px rgba(51,153,255,0.8)');

    } 
    function dragleave(event) {
        event.preventDefault();
        event.stopPropagation();
        dropArea.css('box-shadow','0 0 0px rgba(51,153,255,0.8)');
    }    
    function drop(event) {
        event.preventDefault();
        event.stopPropagation();
        console.log(event.originalEvent.dataTransfer.files);
        processFiles(event.originalEvent.dataTransfer.files);
    }
        
    dropArea.bind('dragenter', dragenter);
    dropArea.bind('dragleave', dragleave);
    dropArea.bind('dragover', dragover);
    dropArea.bind('drop', drop); 
});


// Take care of next file when upload is finished
function handleComplete(size) {
    uploadNext();
}

// Update progression
function handleProgress(event) {
    var progress = totalProgress + event.loaded;
}

// On state changed ajax answer
function stateChanged() {
  if (xhr.readyState == 4  && xhr.status == 200 ){
	var result = xhr.responseText; // Get the reponse text
  }
}

// Process the files on drop
function processFiles(filelist) {

    if (!filelist || !filelist.length || list.length) return;

    totalSize = 0;

    for (var i = 0; i < filelist.length && i < 5; i++) {
        list.push(filelist[i]);
        totalSize += filelist[i].size;
    }
    uploadNext();
}


// Transfer the file
function uploadFile(file, status) {
	// console.log('Uploading file: '+JSON.stringify(file));

    formData = new FormData();
    formData.append("file", file);

    // console.log(formData);

   $.ajax({
        url: 'http://localhost:3000/upload',
        type: 'POST',
        data: formData,
        cache: false,
        processData: false, // Don't process the files
        contentType: false, // Set content type to false as jQuery will tell the server its a query string request
        success: function(data, textStatus, jqXHR)
        {
        	if(typeof data.error === 'undefined')
        	{
        		// Success so call function to process the form
        		submitForm(event, data);
        	}
        	else
        	{
        		// Handle errors here
        		console.log('ERRORS: ' + data.error);
        	}
        },
        error: function(jqXHR, textStatus, errorThrown)
        {
        	// Handle errors here
        	console.log('ERRORS: ' + textStatus);
        	// STOP LOADING SPINNER
        }
    });


 //    // now post a new XHR request
 //    xhr = new XMLHttpRequest();

 //    xhr.onreadystatechange = stateChanged;

 //    xhr.open('POST', 'http://localhost:3000/upload');
    
 //    xhr.onload = function () {
 //      	if (xhr.status === 200) {
 //            console.log('all done: ' + xhr.status);
          
 //        } else {
 //        		console.log(xhr);
 //            console.log('Something went terribly wrong...');
 //        }
	// };
	// debugger;
	// xhr.send(formData);
}

// Upload the next file when the previous one is done
function uploadNext() {

    if (list.length) {

        var nextFile = list.shift();

        if (nextFile.size >= 262144000) { // 256 kb
            handleComplete(nextFile.size);

        } else {
            fileN = nextFile.name;
            uploadFile(nextFile, status);
        }
    } else {
        dropArea.className = '';
    }
}

