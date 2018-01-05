var setUpFrame = () => { 
	console.log("Entrou");
    const frame = window.frames['reportsIframe'];
    if(frame !== undefined){
    	console.log("tem frame");
    	console.log(frame);
    	console.log(frame.window);
		frame.addUserData(current_user_name, current_user_id);
    }
}