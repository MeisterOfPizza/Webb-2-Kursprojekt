function send(form) {
    if (form["improvements"].value.length >= 25) {
        alert("Sent!");

        form.clear();
    }
    else {
        alert("The improvements text needs to be at least 25 characters long.");
    }

    return false;
}