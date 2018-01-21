var setUpFrame = () => { 
    var frame = $("#reportsIframe").get(0).contentWindow || $("#reportsIframe").get(0).document;
    
    console.log(frame);
    if(frame !== undefined){
		frame.addUserData(current_user_name, current_user_id);
    }
}