innuendoApp.controller("uploadsCtrl", function($scope, $http) {

$scope.uploadFiles = function(){

	var formData = new FormData();

	// Add the file to the request.
	var fileInput = document.getElementById('input-1a');
	var file = fileInput.files[0];

	formData.append('file', file);

	req = {
        url: '/api/v1.0/uploads/',
        method:'POST',
        data: formData,
        contentType: false,
		processData: false
    }
	
	$http(req).then(function(response){
            console.log('Upload completed');
        },
        function(response){
            console.log(response.statusText);
    });

    $('#input-1a').fileinput("clear");

}
});