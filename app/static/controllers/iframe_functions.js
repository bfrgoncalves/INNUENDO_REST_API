const setUpFrame = () => { 
	console.log("Entrou");
    const frame = window.frames['reportsIframe'];
    if(frame !== undefined){
    	console.log("tem frame");
		frame.addUserData(current_user_name, current_user_id);
    }
}