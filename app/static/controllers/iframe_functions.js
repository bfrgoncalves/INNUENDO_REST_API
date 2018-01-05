var setUpFrame = () => { 
	console.log("Entrou");
    var frame = window.frames;
    var frame = $("#reportsIframe").get(0);
    if(frame !== undefined){
    	console.log("tem frame");
    	console.log(frame);
    	console.log(frame.window);
		frame.addUserData(current_user_name, current_user_id);
    }
}