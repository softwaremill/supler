$(document).ready(function(){
    $.get('/rest/form1.json', function(data) {
        showForm(data);
    });
});

var formContainer: HTMLDivElement = <HTMLDivElement>document.getElementById("form-container");
var form = null;

function showForm(formJson) {
    form = new SuplerForm(formContainer, {});
    form.render(formJson);
}

var feedback = $("#feedback")
feedback.hide();

$("#submit").click(function() {
    /*var errors = form.validate();

     if (errors.length) {
     console.log(errors);
     feedback.html("Client-side validation errors: " + errors);
     feedback.show();
     } else {*/
    $.ajax({
        url: "/rest/form1.json",
        type: "POST",
        data: JSON.stringify(form.getValue()),
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        success: function(data) {
            feedback.html(data);
            feedback.show();
        }
    })
    /*}  */

    return false;
});