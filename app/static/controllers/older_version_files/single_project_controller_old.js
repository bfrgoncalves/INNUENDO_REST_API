innuendoApp.controller("projectCtrl", function($scope, $http) {

	$scope.project = {};
	$scope.pipelines = [];
    $scope.specie_name = "";
    $scope.species_id = "";
    $scope.strains = [];
    $scope.strains_headers = [];
    $scope.public_strains = [];
    $scope.files = [];

    var pipelinesByName = {};
    var pipelinesByID = {};
    var strainID_pipeline = {};


    var strains_dict = {};
    var strain_id_to_name = {};

    var pipelines_applied = {};


$scope.showProject = function(){
    setTimeout(function(){
        $scope.$apply(function(){

            $scope.getWorkflows();
            $scope.getStrains();
            $scope.getProjectStrains();
            $scope.specie_name = CURRENT_SPECIES_NAME;
            $scope.species_id = CURRENT_SPECIES_ID;
            $scope.getUploadedFiles();
            setTimeout(function(){
                $scope.getAppliedPipelines();
            }, 1000);

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

$scope.getWorkflows = function(){

    req = {
        url: 'api/v1.0/workflows/', //Defined at utils.js
        method:'GET'
    }

    $http(req).then(function(response){
            
            $scope.project = CURRENT_PROJECT;
            if (typeof response.data != 'string'){
                $scope.pipelines = response.data;
                for (i in $scope.pipelines){
                    pipelinesByName[$scope.pipelines[i].name] = $scope.pipelines[i].id;
                    pipelinesByID[$scope.pipelines[i].id] = $scope.pipelines[i].name;
                }
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

                    strain_id_to_name[data[i].id] = data[i].strainID;

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

$scope.getAppliedPipelines = function(){

    req = {
        url: 'api/v1.0/projects/'+CURRENT_PROJECT_ID+'/pipelines/',
        method:'GET'
    }

    $http(req).then(function(response){
            for (i in response.data){
                strainID_pipeline[response.data[i].strain_id] = response.data[i].id;
                ngs_onto_request_appliedPipelines(response.data[i].id, response.data[i].strain_id);
            }
        },
        function(response){
            console.log(response.statusText);
    });

    function ngs_onto_request_appliedPipelines(pipeline_id, strain_id){

        req = {
            url: 'api/v1.0/ngsonto/projects/'+CURRENT_PROJECT_ID+'/pipelines/'+pipeline_id+'/workflows/',
            method:'GET'
        }

        $http(req).then(function(response){
            var appliedPipelines = [];
            for (w in response.data){
                workflow_id = response.data[w].workflowURI.split('<')[1].split('>')[0].split('/');
                workflow_id = workflow_id[workflow_id.length-1];
                appliedPipelines.push(workflow_id);
                appliedPipelines = appliedPipelines.reverse();
            }
            applyPipelineToStrain(strain_id_to_name[strain_id], appliedPipelines);
        },
        function(response){
            console.log(response.statusText);
        });
    }

    function applyPipelineToStrain(strain_name, workflow_ids){

        var table = $('#strains_table').DataTable();
    
        var selected_indexes = $.map(table.rows().indexes(), function(index){
            return index;
        });

        var strain_names = $.map(table.rows().data(), function(item){
            return item[1];
        });

        for(w in workflow_ids){

            workflow_id = workflow_ids[w];

            buttonselectedPipeline = '<button class="btn btn-sm btn-default">'+ pipelinesByID[workflow_id] + '</button>';


            for(i in selected_indexes){
                var toAdd = '';
                if(strain_names[i] == strain_name){
                    if(!pipelines_applied.hasOwnProperty(strain_name)){
                        pipelines_applied[strain_name] = [];
                    }
                    if(pipelines_applied[strain_name].indexOf(buttonselectedPipeline) < 0) pipelines_applied[strain_name].push(buttonselectedPipeline);
                    
                    for(j in pipelines_applied[strain_name]){
                        toAdd += pipelines_applied[strain_name][j];
                    }
                    table.cell(selected_indexes[i], -1).data(toAdd);
                }
            
            }
        }
        table.draw();
    }

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
            console.log(data);
            if (data.length != 0){

                $scope.strains_headers = JSON.parse(data[0].fields).metadata_fields;
                $scope.strains_headers.push('Analysis');
                
                for (i in data){

                    var strain_data = JSON.parse(data[i].strain_metadata);
                    strain_data['Analysis'] = "";
                    var sd = {};
                    for (j in $scope.strains_headers){
                        if(strain_data.hasOwnProperty($scope.strains_headers[j])){
                            sd[$scope.strains_headers[j]] = strain_data[$scope.strains_headers[j]];
                        }
                    }
                    console.log(data[i].strainID);
                    if(!strains_dict.hasOwnProperty(data[i].strainID)){
                        strains_dict[data[i].strainID] = data[i].id;
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

    function ngs_onto_request(id) {

        req_ngs_onto = {
            url: 'api/v1.0/ngsonto/strains/',
            method:'POST',
            data: { strain_id: id }
        }

        $http(req_ngs_onto).then(function(response){
            console.log('DONE!');
        }, function(response){
            console.log(response.statusText);
        }); 

    }

    $http(req).then(function(response){
            ngs_onto_request(response.data.id);
            //$scope.createPipeline(response.data); //Create pipeline for each strain added to the project
            
            var data = response.data;
            destroyTable('strains_table');
            console.log(data);

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
                if(!strains_dict.hasOwnProperty(data.strainID)){
                    strains_dict[data.strainID] = data.id;
                }
                $scope.strains.push(sd);

                loadDataTables('strains_table', $scope.strains);

                show_message('project_strain_message_div', 'success', 'Strains were added to the project.');
            
            }

        },
        function(response){
            loadDataTables('strains_table', $scope.strains);
            show_message('project_strain_message_div', 'warning', 'Strain ' + strain_name + ' already on project.');
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
    else show_message('database_strain_message_div', 'warning', 'Please select some strains first.');
}

$scope.add_New_Strain = function(){

    req = {
        url: 'api/v1.0/strains/',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        method:'POST',
        data: $('#new_strain_form').find("select, input").serialize()
    }

    $http(req).then(function(response){
            strain_id_to_name[response.data.id] = response.data.strainID;
            $scope.addStrainToProject(response.data.strainID);
        },
        function(response){
            show_message('new_strain_message_div', 'warning', 'An error as occurried when creating a new strain.');
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
                show_message('project_strain_message_div', 'success', 'Strains removed from project.');
            },
            function(response){
                console.log(response.statusText);
                show_message('project_strain_message_div', 'warning', 'An error occurried when removing strains from project.');
        });

    }
    loadDataTables('strains_table', $scope.strains);
}

$scope.applyWorkflow = function(){

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
    if (selected_indexes.length == 0) show_message('project_procedures_message_div', 'warning', 'Select strains to apply procedures.');
    else show_message('project_procedures_message_div', 'success', 'Procedure applied.');
}

$scope.createPipeline = function(strain_Name, callback){

    strain_id = strains_dict[strain_Name];
    console.log(strain_Name);
    console.log('----');

    checkIfPipelineExists(strain_id, function(pipeline_id, strain_id){
        if(pipeline_id == false){
            addIfNotExists(strain_id);
        }
        else {
            console.log('Pipeline already exists');
            console.log(strain_id, pipeline_id);
            callback(strain_id, pipeline_id);
        }
    })

    function checkIfPipelineExists(strain_id, callback2){

        req = {
            url: 'api/v1.0/projects/'+CURRENT_PROJECT_ID+'/pipelines/',
            method:'GET',
            params: {
                strain_id: strain_id
            }
        }
        $http(req).then(function(response){
               callback2(response.data.id, response.data.strain_id);
            },
            function(response){
                console.log(response.statusText);
                callback2(false, strain_id);
        });
    }

    function addIfNotExists(strain_id){

        req = {
            url: 'api/v1.0/projects/'+CURRENT_PROJECT_ID+'/pipelines/',
            method:'POST',
            data: {
                strain_id: strain_id
            }
        }

        $http(req).then(function(response){

               console.log('DONE');
               ngsonto_request_createPipeline(response.data.id, response.data.strain_id);
            },
            function(response){
                console.log(response.statusText);
        });
    
    }

    function ngsonto_request_createPipeline(pipeline_id, strain_id) {

        req = {
            url: 'api/v1.0/ngsonto/projects/'+CURRENT_PROJECT_ID+'/pipelines/',
            method:'POST',
            data: {
                pipeline_id: pipeline_id
            }
        }

        $http(req).then(function(response){

           console.log('DONE NGSOnto');
           callback(strain_id, pipeline_id);
        },
        function(response){
            console.log(response.statusText);
        });
    }

}

$scope.savePipelines = function(){

    var table = $('#strains_table').DataTable();
    
    var selected_indexes = $.map(table.rows('.selected').indexes(), function(index){
        return index;
    });

    for(i in selected_indexes){
        console.log($scope.strains[selected_indexes[i]].strainID);
            
        $scope.createPipeline($scope.strains[selected_indexes[i]].strainID, function(strain_id, pipeline_id){
            console.log(strain_id_to_name[strain_id]);
            console.log(strain_id_to_name);
            console.log(strain_id);
            pipelines_applied[strain_id_to_name[strain_id]].map(function(d, x){
                workflowName = d.split('>')[1].split('</')[0];
                ngs_onto_request_workflow_order(CURRENT_PROJECT_ID, pipeline_id, pipelinesByName[workflowName], x)
            });
        });

    }

    function ngs_onto_request_workflow_order(project_id, pipeline_id, workflow_id, pipeline_step){
        console.log("------- Pipeline data -----");
        console.log(workflow_id);
        console.log(project_id);
        console.log(pipeline_id);
        console.log(pipeline_step);

        req = {
            url: 'api/v1.0/ngsonto/projects/'+project_id+'/pipelines/' + pipeline_id + '/workflows/',
            method:'POST',
            data: {
                workflow_id: workflow_id,
                step: pipeline_step + 1
            }
        }

        $http(req).then(function(response){

           console.log('DONE NGSOnto');
        },
        function(response){
                console.log(response.statusText);
        });
    }

    show_message('project_procedures_message_div', 'success', 'Procedure state saved.');
    

}

$scope.runPipelines = function(){

    var table = $('#strains_table').DataTable();

    var strain_names = $.map(table.rows('.selected').data(), function(item){
        return item[1];
    });


    for(i in strain_names){

        console.log(strainID_pipeline[strains_dict[strain_names[i]]]);
        
        if(pipelines_applied[strain_names[i]] != undefined){
            req = {
                url: 'api/v1.0/ngsonto/projects/'+CURRENT_PROJECT_ID+'/pipelines/'+strainID_pipeline[strains_dict[strain_names[i]]]+'/processes/',
                method:'POST',
                data: {
                    strain_id: strains_dict[strain_names[i]]
                }
            }

            $http(req).then(function(response){
               console.log('DONE NGSOnto');
            },
            function(response){
                console.log(response.statusText);
            });
        }


    }

}



});
