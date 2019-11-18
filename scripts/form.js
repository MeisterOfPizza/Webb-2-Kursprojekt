function send(form) {
    if (form["improvements"].value.length >= 25) {
        window.location.href = "#done";

        form.reset();
    }
    else {
        alert("The improvements text needs to be at least 25 characters long.");
    }

    return false;
}