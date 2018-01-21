var setUpFrame = () => { 
    var frame = $("#reportsIframe").get(0).document || $("#reportsIframe").get(0).contentWindow;
    
    if(frame !== undefined){
		frame.addUserData(current_user_name, current_user_id);
    }
}