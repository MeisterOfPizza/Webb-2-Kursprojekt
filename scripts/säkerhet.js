let hashOutput;

$(document).ready(function() {
    hashOutput = $("#hash-output")[0];
});

function hash(input) {
    let hash = 0, i, chr;

    for (i = 0; i < input.value.length; i++) {
        chr = input.value.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }

    hashOutput.innerText = "Resultat: " + (hash >>> 0); // Make it positive.
}