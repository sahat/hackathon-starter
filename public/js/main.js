$(document).ready(function() {
    $("#updaterForm").click(function(){
        $("#sporthide").hide();
        $("#editform").show();
    });
    // Place JavaScript code here...
    $("#updater").click(function(e){
        e.preventDefault();
        $.ajax({
            method: "post",
            url: "/updateSport",
            data: {_csrf: $("#_csrf").val(),id: $("#id").val(), name: $("#name").val(), type: $("#type").val() }
        })
            .done(function( msg ) {
                console.log(msg);
                $('#sporthide').show();
                $('#editform').hide();
            });
    })

    $("#deleteAjax").click(function(){
        $.ajax({
            method: "post",
            url: "/deleteSport",
            data: {_csrf:$("#_csrf").val(), name:$("#name").val(), type:$("#type").val() }
        })
        .done(function( msg ) {
            console.log(msg);
            //$('#sporthide').show();
            //$('#editform').hide();
        });
    })
});

