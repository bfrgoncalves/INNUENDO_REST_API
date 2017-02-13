innuendoApp.controller("uploadsCtrl", function($scope, $http) {

    var pg_requests = new Requests(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http);
    $scope.upload_pass = ""
    
    $scope.getUploadToken = function(){
        pg_requests.get_upload_token(CURRENT_USER_NAME, function(response){
            $scope.upload_pass = response.data.upload_pass
        });


    }
});