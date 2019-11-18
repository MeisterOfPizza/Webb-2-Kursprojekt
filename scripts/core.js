let cursor;
let holdProgressBar;

let cursorTargetPoint = { x: 0, y: 0 };

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

function lerp(start, end, t) {
    return (1 - t) * start + t * end;
}

$(document).ready(function() {
    $("#open-menu-button").click(function() {
        $("#page-top-header").addClass("show");
        $("#content").css("filter", "blur(5px)");

    });
    $("#close-menu-button").click(function() {
        $("#page-top-header").removeClass("show");
        $("#content").css("filter", "none");
    });

    $(document).mousemove(function (event) {
        if (onMouseMove !== undefined) {
            onMouseMove(event, { x: event.pageX - lastCursorPoint.x, y: event.pageY - lastCursorPoint.y });
        }

        lastCursorPoint = { x: event.pageX, y: event.pageY }
    });

    $(document).mousemove(function (event) {
        lastMousePoint = { x: event.pageX, y: event.pageY };
    });

    $(".fracture-container").each(function () {
        $(this).mouseenter(function (e) {
            let children = $(this).children();

            if (!children.last().hasClass("fracture")) {
                children.each(function (index) {
                    let child = $(this);

                    setTimeout(function () {
                        child.addClass("fracture");

                        setTimeout(function () {
                            child.removeClass("fracture");
                        }, 1100);
                    }, index * 15);
                });
            }
        });

        let container = $(this);
        setTimeout(function() {
            container.mouseenter();
        }, 100);
    });

    updateCursor();
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
    
    $(document).mousemove(function (event) {
        cursorTargetPoint.x = event.pageX;
        cursorTargetPoint.y = event.pageY;
    });

    $(window).mousedown(function () {
        holdProgressBar.animate(1);
    });

    $(window).mouseup(function() {
        holdProgressBar.animate(0);
    });
}

function updateCursor() {
    requestAnimationFrame(updateCursor);

    cursorStyling.left = lerp(cursorStyling.left, cursorTargetPoint.x, 0.05);
    cursorStyling.top  = lerp(cursorStyling.top, cursorTargetPoint.y, 0.05);

    if (cursor !== undefined) {
        cursor.css(cursorStyling);
    }
}