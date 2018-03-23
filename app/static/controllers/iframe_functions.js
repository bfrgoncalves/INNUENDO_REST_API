
/**
 * Function for iframe comunication with the platform.
 * Needs to use var declaration to work.
 */
var setUpFrame = (callback) => {
    const reportFrameEl = $("#reportsIframe");
    var frame = reportFrameEl.get(0).document || reportFrameEl.get(0).contentWindow;

    if(frame !== undefined){
        frame.addUserData(current_user_name, current_user_id, () => {
            console.log("LOADED_USER_DATA");
            callback();
        });
    }
};

var check_to_load_reports = () => {

    if (TO_LOAD_STRAINS === "" && TO_LOAD_PROJECTS === ""){
        return false;
    }

    console.log("CHECKING REPORTS");

    $("#overlayProjects").css({"display":"block"});
    $("#overlayWorking").css({"display":"block"});
    $("#single_project_controller_div").css({"display":"none"});
    $("#submission_status").empty();

    const reportFrameEl = $("#reportsIframe");
    var frame = reportFrameEl.get(0).document || reportFrameEl.get(0).contentWindow;

    console.log(TO_LOAD_STRAINS, TO_LOAD_PROJECTS);

    if(frame !== undefined){
        frame.loadReport(TO_LOAD_STRAINS, TO_LOAD_PROJECTS);
    }


};


var loadReport = (selectedRows, current_project_d, scope) => {

    $("#overlayProjects").css({"display":"block"});
    $("#overlayWorking").css({"display":"block"});
    $("#single_project_controller_div").css({"display":"none"});
    $("#submission_status").empty();

    TO_LOAD_PROJECTS = current_project_d;
    TO_LOAD_STRAINS = selectedRows;

    scope.$apply( () => {
        scope.selectedTemplate.path = '/app/static/html_components/reports_view.html';
    });

};