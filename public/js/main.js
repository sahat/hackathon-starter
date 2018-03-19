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

    $("form").each(function(e){
        var form = this;

        $(form).find(".btnD").click(function(e){
            e.preventDefault();
            console.log("hihi");
            var name=$(form).find(".name").val();
            $.ajax({
                method: "post",
                url: "/deleteSport",
                data: {_csrf:$("#_csrf").val(), name:name, type:$("#type").val() }
            })
                .done(function( msg) {
                    console.log(msg);
                    $(form).parent().remove();
                });

        })

    })
});

