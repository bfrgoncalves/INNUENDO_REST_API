
/**
 * Function for iframe comunication with the platform.
 * Needs to use var declaration to work.
 */
var setUpFrame = () => {
    const reportFrameEl = $("#reportsIframe");
    var frame = reportFrameEl.get(0).document || reportFrameEl.get(0).contentWindow;

    if(frame !== undefined){
        frame.addUserData(current_user_name, current_user_id);
    }
};

var loadReport = (selectedRows, current_project_d) => {
    const reportFrameEl = $("#reportsIframe");
    var frame = reportFrameEl.get(0).document || reportFrameEl.get(0).contentWindow;

    if(frame !== undefined){
        frame.loadReport(selectedRows, current_project_d);
    }
};