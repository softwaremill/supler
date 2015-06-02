var formContainer = document.getElementById('product_form_container');
var feedback = $('#feedback');
feedback.hide();

function sendForm(formValue, renderResponseFn, sendErrorFn) {
    console.log("Sending data to server..");
    $.ajax({
        url: '/api/test/products',
        type: 'POST',
        data: JSON.stringify(formValue),
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        success: renderResponseFn,
        error: sendErrorFn
    });
};
var form = new Supler.Form(formContainer, {
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
    },
    custom_data_handler: function(data) {
        feedback.html(data);
        feedback.show();
    },
    after_render_function: function() {
        $('[name = "birthday"]').datepicker({
            autoclose: true,
            format: 'yyyy-mm-dd'
        });
    }
});

$(document).ready(function() {
    $.get('/api/test/products/1', function(data) {
        form.render(data);
    });
});
