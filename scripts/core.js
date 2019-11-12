let cursor;
let holdProgressBar;

let cursorStyling = {
    "left": 0,
    "top": 0,
    "display": "block",
    "width": "0px",
    "height": "0px"
}

const holdTimeFinish = 0.25;

var lastCursorPoint = { x: 0, y: 0 };

var onCursorHoldFinish;
var onCursorHoldEnd;
var onMouseMove;

$(document).ready(function() {
    $("#open-menu-button").click(function() {
        $("#page-top-header").removeClass("hide");
    });
    $("#close-menu-button").click(function() {
        $("#page-top-header").addClass("hide");
    });
});

function createCustomMouse() {
    let cursorRadius = 10;
    let svgDiameter = cursorRadius * 2;
    let customCursor = `
    <div id='custom-cursor-container'>
        <div id='custom-cursor'>
            <svg width="${svgDiameter * 2}" height="${svgDiameter * 2}">
                <circle cx="50%" cy="50%" r="${cursorRadius}" stroke="white" stroke-width="2" fill="transparent" />
                <circle cx="50%" cy="50%" r="${cursorRadius / 3.0}" stroke="white" stroke-width="2" fill="transparent" />
            </svg>
        </div>
    </div>
    `;

    cursorStyling.width  = svgDiameter * 2 + "px";
    cursorStyling.height = svgDiameter * 2 + "px";

    let html = $.parseHTML(customCursor);
    $("body").append(html);
    cursor = $("#custom-cursor");

    holdProgressBar = new ProgressBar.Circle("#custom-cursor", {
        color: "white",
        strokeWidth: 7,
        duration: holdTimeFinish * 1000,
        easing: "easeInOut",
        svgStyle: {
            position: "absolute",
            top: "0%",
            left: "0%",
            transform: "translate(-50%, -50%)",
            width: svgDiameter * 1.5 + "px",
            height: svgDiameter * 1.5 + "px"
        },
        step: (state, bar) => {
            if (bar.value() === 1) {
                if (onCursorHoldFinish !== undefined) {
                    onCursorHoldFinish();
                }
            }
            else {
                if (onCursorHoldEnd !== undefined) {
                    onCursorHoldEnd();
                }
            }
        }
    });
    
    $(window).mousemove(function (event) {
        cursorStyling.left = event.pageX;
        cursorStyling.top = event.pageY;

        cursor.css(cursorStyling);

        if (onMouseMove !== undefined) {
            onMouseMove(event, { x: event.pageX - lastCursorPoint.x, y: event.pageY - lastCursorPoint.y });
        }

        lastCursorPoint = { x: event.pageX, y: event.pageY }
    });

    $(window).mousedown(function () {
        holdProgressBar.animate(1);
    });

    $(window).mouseup(function() {
        holdProgressBar.animate(0);
    });
}