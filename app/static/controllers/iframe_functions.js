var setUpFrame = () => { 

    //var frame = $("#reportsIframe").get(0).contentWindow || $("#reportsIframe").get(0).document;
    var frame = document.getElementById("reportsIframe");

    const getIframeWindow = (iframe_object) => {
	  var doc;

	  if (iframe_object.contentWindow) {
	    return iframe_object.contentWindow;
	  }

	  if (iframe_object.window) {
	    return iframe_object.window;
	  } 

	  if (!doc && iframe_object.contentDocument) {
	    doc = iframe_object.contentDocument;
	  } 

	  if (!doc && iframe_object.document) {
	    doc = iframe_object.document;
	  }

	  if (doc && doc.defaultView) {
	   return doc.defaultView;
	  }

	  if (doc && doc.parentWindow) {
	    return doc.parentWindow;
	  }

	  return undefined;
	}

    
    console.log(frame);
    if(frame !== undefined){
		getIframeWindow(frame).addUserData(current_user_name, current_user_id);
    }
}