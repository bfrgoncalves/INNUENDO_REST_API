
/**
 * Function for iframe comunication with the platform.
 * Needs to use var declaration to work.
 */
var setUpFrame = (callback) => {
    const reportFrameEl = $("#reportsIframe");
    var frame = reportFrameEl.get(0).document || reportFrameEl.get(0).contentWindow;

    if(frame !== undefined){
        frame.addUserData(current_user_name, current_user_id, () => {
            callback();
        });
    }
};

var loadReport = (selectedRows, current_project_d, scope) => {

    $("#overlayProjects").css({"display":"block"});
    $("#overlayWorking").css({"display":"block"});
    $("#single_project_controller_div").css({"display":"none"});
    $("#submission_status").empty();

    scope.$apply( () => {
        scope.selectedTemplate.path = '/app/static/html_components/reports_view.html';
        setTimeout(() => {
            setUpFrame(() => {
                const reportFrameEl = $("#reportsIframe");
                var frame = reportFrameEl.get(0).document || reportFrameEl.get(0).contentWindow;

                if(frame !== undefined){
                    frame.loadReport(selectedRows, current_project_d);
                }
            });
        }, 2000);
    });

};