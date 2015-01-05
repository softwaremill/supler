var formContainer = document.getElementById('form-container');
var form = new SuplerForm(formContainer, {
    send_form_function: sendForm,
    i18n: {
        error_custom_lastNameLongerThanFirstName: "Last name must be longer than first name!",
        error_custom_illegalDateFormat: "Illegal date format",
        label_person_firstname: "First name",
        label_person_lastname: "Last name",
        label_lego_name: "Name",
        label_lego_theme: "Theme",
        label_lego_setnumber: "Set number",
        label_lego_age: "Age"
    }
});

$(document).ready(function() {
    $.get('/rest/form1.json', function(data) {
        form.render(data);
    });
});

var feedback = $('#feedback');
feedback.hide();

function sendForm(formValue, responseFn, sendErrorFn, isAction) {
    $.ajax({
        url: '/rest/form1.json',
        type: 'PUT',
        data: JSON.stringify(formValue),
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        success: responseFn,
        error: sendErrorFn
    });
}

$('#submit').click(function() {
    var hasErrors = form.validate();

    if (hasErrors) {
        feedback.html('There are client-side validation errors.');
        feedback.show();
    } else {
        $.ajax({
            url: '/rest/form1.json',
            type: 'POST',
            data: JSON.stringify(form.getValue()),
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            success: function (data) {
                if (data.msg) {
                    feedback.html(data.msg);
                } else {
                    feedback.html('There are server-side apply or validation errors');
                    form.render(data);
                }
                feedback.show();
            }
        });
    }

    return false;
});