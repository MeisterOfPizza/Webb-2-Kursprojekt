function send(form) {
    if (form["improvements"].value.length >= 25) {
        window.location.href = "#done";

        form.reset();
    }
    else {
        alert("Förbättrings texten måste innehålla åtminstone 25 karaktärer!");
    }

    return false;
}