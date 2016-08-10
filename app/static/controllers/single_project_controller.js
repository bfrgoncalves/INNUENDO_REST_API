innuendoApp.controller("projectCtrl", function($scope, $http) {

	$scope.project = {};
	$scope.pipelines = [];
    $scope.specie_name = "";
    $scope.species_id = "";
    $scope.strains = [];
    $scope.strains_headers = [];
    $scope.public_strains = [];
    $scope.files = [];

    var pipelines_applied = {};


$scope.showProject = function(){
    setTimeout(function(){
        $scope.$apply(function(){

            $scope.getPipelines();
            $scope.getStrains();
            $scope.getProjectStrains();
            $scope.specie_name = CURRENT_SPECIES_NAME;
            $scope.species_id = CURRENT_SPECIES_ID;
            $scope.getUploadedFiles();

        });
    }, 100);
}

$scope.deleteProject = function(){

    req = {
        url:'api/v1.0/projects/' + CURRENT_PROJECT_ID,
        method:'DELETE'
    }

    $http(req).then(function(response){
            console.log("Project Deleted");
    });
};

$scope.getPipelines = function(){

    req = {
        url: CURRENT_PROJECT.pipelines, //Defined at utils.js
        method:'GET'
    }

	$http(req).then(function(response){
            
            $scope.project = CURRENT_PROJECT;
            if (typeof response.data != 'string'){
                $scope.pipelines = response.data;
            }

        },function(response){
            console.log(response.statusText);
            $scope.project = CURRENT_PROJECT;
    });

}

$scope.addPipeline = function(){

    req = {
        url: CURRENT_PROJECT.pipelines,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        method:'POST',
        data:$('#new_pipeline_form').serialize()
    }

    $http(req).then(function(response){
      		$scope.pipelines.push(response.data);
            console.log('Pipeline added');
        },
        function(response){
            console.log(response.statusText);
    });	
}

$scope.getStrains = function(){

    req = {
        url: 'api/v1.0/strains/',
        method:'GET'
    }

    $http(req).then(function(response){
            
            var max_headers = 0;
            var data = response.data;
            destroyTable('public_strains_table');
            var strains = [];

            if (data.length != 0){

                $scope.public_strains_headers = JSON.parse(data[0].fields).metadata_fields;
                $scope.public_strains_headers.push('Analysis');
                
                for (i in data){

                    var strain_data = JSON.parse(data[i].strain_metadata);
                    strain_data['Analysis'] = "";
                    var sd = {};
                    for (i in $scope.public_strains_headers){
                        if(strain_data.hasOwnProperty($scope.public_strains_headers[i])){
                            sd[$scope.public_strains_headers[i]] = strain_data[$scope.public_strains_headers[i]];
                        }
                    }

                    strains.push(sd);
                }
                $scope.public_strains = strains;
                
            }
            loadDataTables('public_strains_table', $scope.public_strains);
        },
        function(response){
            console.log(response.statusText);
    });

}

$scope.getUploadedFiles = function(){

    req = {
        url: 'api/v1.0/uploads/',
        method:'GET'
    }

    $http(req).then(function(response){
            $scope.files = response.data.files;
        },
        function(response){
            console.log(response.statusText);
    });

}

$scope.getProjectStrains = function(){

    req = {
        url: 'api/v1.0/projects/'+CURRENT_PROJECT_ID+'/strains/',
        method:'GET'
    }

    $http(req).then(function(response){
            
            var max_headers = 0;
            var data = response.data;
            destroyTable('strains_table');
            var strains = [];

            if (data.length != 0){

                $scope.strains_headers = JSON.parse(data[0].fields).metadata_fields;
                $scope.strains_headers.push('Analysis');
                
                for (i in data){

                    var strain_data = JSON.parse(data[i].strain_metadata);
                    strain_data['Analysis'] = "";
                    var sd = {};
                    for (i in $scope.strains_headers){
                        if(strain_data.hasOwnProperty($scope.strains_headers[i])){
                            sd[$scope.strains_headers[i]] = strain_data[$scope.strains_headers[i]];
                        }
                    }

                    strains.push(sd);
                }
                $scope.strains = strains;
                
            }
            loadDataTables('strains_table', $scope.strains);
        },
        function(response){
            console.log(response.statusText);
    });

}

$scope.addStrainToProject = function(strain_name){

    req = {
        url: 'api/v1.0/projects/'+CURRENT_PROJECT_ID+'/strains/',
        method:'PUT',
        data: {
            "strainID": strain_name
        }
    }

    $http(req).then(function(response){

            var data = response.data;
            destroyTable('strains_table');

            if (data.length != 0){
                $scope.strains_headers = JSON.parse(data.fields).metadata_fields;
                $scope.strains_headers.push('Analysis');
                
                var strain_data = JSON.parse(data.strain_metadata);
                strain_data['Analysis'] = "";
                var sd = {};
                for (i in $scope.strains_headers){
                    if(strain_data.hasOwnProperty($scope.strains_headers[i])){
                        sd[$scope.strains_headers[i]] = strain_data[$scope.strains_headers[i]];
                    }
                }

                $scope.strains.push(sd);

                loadDataTables('strains_table', $scope.strains);
            
            }

        },
        function(response){
            console.log(response.statusText);
    });
}

$scope.add_Database_Strains = function(){

    var strain_names = $.map($('#public_strains_table').DataTable().rows('.selected').data(), function(item){
        return item[1];
    });

    if(strain_names.length > 0){
        destroyTable('strains_table');
        for(i in strain_names){
            $scope.addStrainToProject(strain_names[i]);
        }
    }
}

$scope.add_New_Strain = function(){

    req = {
        url: 'api/v1.0/strains/',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        method:'POST',
        data: $('#new_strain_form').find("select, input").serialize()
    }

    $http(req).then(function(response){
            $scope.addStrainToProject(response.data.strainID);
        },
        function(response){
            console.log(response.statusText);
    });

} 

$scope.removeStrainsFromProject = function(){

    var strain_names = $.map($('#strains_table').DataTable().rows('.selected').data(), function(item){
        return item[1];
    });

    var strain_indexes = $.map($('#strains_table').DataTable().rows('.selected').indexes(), function(index){
        return index;
    });

    strain_indexes.map(function(d){
        delete pipelines_applied[d];
    });


    destroyTable('strains_table');
    
    for (i in strain_names){

        strain_name = strain_names[i];

        req = {
            url: 'api/v1.0/projects/'+CURRENT_PROJECT_ID+'/strains/',
            method:'DELETE',
            params: {
                "strainID": strain_name
            }
        }

        $http(req).then(function(response){

                var new_strains = [];
                $scope.strains.map(function(d){
                    if (d.strainID != response.data.strainID) new_strains.push(d);
                })
                $scope.strains = new_strains;
            },
            function(response){
                console.log(response.statusText);
        });

    }
    loadDataTables('strains_table', $scope.strains);
}

$scope.applyPipeline = function(){

    var table = $('#strains_table').DataTable();
    
    var selected_indexes = $.map(table.rows('.selected').indexes(), function(index){
        return index;
    });

    var strain_names = $.map(table.rows('.selected').data(), function(item){
        return item[1];
    });

    buttonselectedPipeline = '<button class="btn btn-sm btn-default">'+ $( "#pipeline_selector option:selected" ).val() + '</button>';

    var counter = -1;
    for(i in selected_indexes){
        var toAdd = '';
        counter++;

        if(!pipelines_applied.hasOwnProperty(strain_names[counter])){
            pipelines_applied[strain_names[counter]] = [];
        }
        if(pipelines_applied[strain_names[counter]].indexOf(buttonselectedPipeline) < 0) pipelines_applied[strain_names[counter]].push(buttonselectedPipeline);
        
        for(j in pipelines_applied[strain_names[counter]]){
            toAdd += pipelines_applied[strain_names[counter]][j];
        }

        table.cell(selected_indexes[i], -1).data(toAdd).draw();
    
    }
}

});