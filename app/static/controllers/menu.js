
/**
 * Function to load information for the sidebar
 */
$(document).ready( () => {

    const hamburger_cross = () => {

        if (isClosed === true) {
            overlay.hide();
            trigger.removeClass("is-open");
            trigger.addClass("is-closed");
            isClosed = false;
        } else {
            overlay.show();
            trigger.removeClass("is-closed");
            trigger.addClass("is-open");
            isClosed = true;
        }
    };

    var trigger = $(".hamburger"),
        overlay = $(".overlay"),
        isClosed = false;

    trigger.click( () => {
        hamburger_cross();
    });

    $('[data-toggle="offcanvas"]').click( () => {
        $('#wrapper').toggleClass("toggled");
    });

});