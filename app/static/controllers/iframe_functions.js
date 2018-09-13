/**
 * Function used to send username and id information to reports through
 * postMessage API
 */
var sendMessage = () => {

    const reportFrameEl = $("#reportsIframe");
    var frame = reportFrameEl.get(0).document || reportFrameEl.get(0).contentWindow;

    if (frame !== undefined) {
        const message = {
            projects: TO_LOAD_PROJECTS,
            strains: TO_LOAD_STRAINS,
            current_user_name: current_user_name,
            current_user_id: current_user_id

        };

        frame.postMessage(message, REPORTS_URL);

        setTimeout(() => {
            $("#overlayProjects").css({"display": "none"});
            $("#overlayWorking").css({"display": "none"});
            $("#submission_status").empty();
        }, 5000);
    }

};

/**
 * Function for iframe comunication with the platform.
 * Needs to use var declaration to work.
 */
var setUpFrame = (callback) => {
    const reportFrameEl = $("#reportsIframe");
    var frame = reportFrameEl.get(0).document || reportFrameEl.get(0).contentWindow;

    if (frame !== undefined) {
        frame.addUserData(current_user_name, current_user_id, () => {
            callback();
        });
    }
};

var check_to_load_reports = () => {

    if (TO_LOAD_STRAINS === "" && TO_LOAD_PROJECTS === "") {
        $("#overlayProjects").css({"display": "none"});
        $("#overlayWorking").css({"display": "none"});
        $("#submission_status").empty();
        return false;
    }

    const reportFrameEl = $("#reportsIframe");
    var frame = reportFrameEl.get(0).document || reportFrameEl.get(0).contentWindow;

    if (frame !== undefined) {
        frame.postMessage({
            projects: TO_LOAD_PROJECTS,
            strains: TO_LOAD_STRAINS
        }, REPORTS_URL);
    }


};


var loadReport = (selectedRows, current_project_d, scope) => {

    $("#overlayProjects").css({"display": "block"});
    $("#overlayWorking").css({"display": "block"});
    $("#single_project_controller_div").css({"display": "none"});
    $("#submission_status").empty();

    TO_LOAD_PROJECTS = current_project_d;
    TO_LOAD_STRAINS = selectedRows;

    scope.$apply(() => {
        scope.selectedTemplate.path = '/app/static/html_components/reports_view.html';
    });

};