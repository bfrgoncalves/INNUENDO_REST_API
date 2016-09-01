innuendoApp.controller("projectsCtrl", function($scope, $http) {


	$scope.projects = [];
    $scope.projects_headers = {};
    $scope.other_projects = [];
    $scope.species = [];
    $scope.currentSpecieID = 1;
    var objects_utils = new Objects_Utils();

    if (get_userid() != 0){

        //Get user projects for specie 1
        req_1 = {
                url:'api/v1.0/projects/species/1',
                method:'GET'
            }

        $http(req_1).then(function(response){
            $scope.projects = response.data.map(function(d){
                    return {name: d.name, description: d.description, date: d.timestamp.split(" ").slice(0, 4).join(' '), id: d.id}
                });


            objects_utils.loadDataTables('projects_table', $scope.projects);
        });

        //Get other projects for specie 1
        req_2 = {
                url:'api/v1.0/projects/species/1',
                method:'GET',
                params: { get_others: true }
            }

        $http(req_2).then(function(response_1){
            $scope.other_projects = response_1.data.map(function(e){
                return {name: e.name, description: e.description, date: e.timestamp.split(" ").slice(0, 4).join(' '), id: e.id}
            });

            objects_utils.loadDataTables('other_projects_table', $scope.other_projects);
        });

        
        //Get species
        req_3 = {
            url:'api/v1.0/species/',
            method:'GET'
        }

        $http(req_3).then(function(response){
            $scope.species = response.data;
            CURRENT_SPECIES_NAME = response.data[0].name;
            CURRENT_SPECIES_ID = response.data[0].id;
        });


    }

$scope.change_project_by_specie = function(species_id, species_name){

    CURRENT_SPECIES_ID = species_id;
    CURRENT_SPECIES_NAME = species_name;
    $scope.currentSpecieID = species_id;

    objects_utils.destroyTable('projects_table');
    objects_utils.destroyTable('other_projects_table');

    req = {
            url:'api/v1.0/projects/species/' + species_id,
            method:'GET'
        }

    $http(req).then(function(response){

            $scope.projects = response.data.map(function(d){
                    return {name: d.name, description: d.description, date: d.timestamp.split(" ").slice(0, 4).join(' '), id: d.id}
                });

            objects_utils.loadDataTables('projects_table', $scope.projects);
        },
        function(error){
            $scope.projects = [];
            objects_utils.loadDataTables('projects_table', $scope.projects);
        }); 


    req = {
            url:'api/v1.0/projects/species/' + species_id,
            method:'GET',
            params: { get_others: true }
        }

    $http(req).then(function(response){

            $scope.other_projects = response.data.map(function(d){
                return {name: d.name, description: d.description, date: d.timestamp.split(" ").slice(0, 4).join(' '), id: d.id}
            });

            objects_utils.loadDataTables('other_projects_table', $scope.other_projects);
        },
        function(error){
            $scope.other_projects = [];

            objects_utils.loadDataTables('other_projects_table', $scope.other_projects);
        }); 

};


$scope.addRow = function(){

    req = {
        url:'api/v1.0/projects/',
        method:'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        data: $('#new_project_form').serialize()
    }

    function ngs_onto_request(id) {

        req_ngs_onto = {
            url: 'api/v1.0/ngsonto/projects/',
            method:'POST',
            data: { study_id: id }
        }

        $http(req_ngs_onto).then(function(response){
            console.log('DONE!');
        }, function(response){
            console.log(response.statusText);
        }); 

    }


	$http(req).then(function(response){
            objects_utils.destroyTable('projects_table');
            
            ngs_onto_request(response.data.id);

	  		$scope.projects.push({name: response.data.name, description: response.data.description, date: response.data.timestamp.split(" ").slice(0, 4).join(' '), id: response.data.id});

            objects_utils.loadDataTables('projects_table', $scope.projects);
            
            $('#newProjectModal').modal('hide');
            objects_utils.show_message('projects_message_div', 'success', 'Project created.');

    }, function(response){
        objects_utils.show_message('new_project_message_div', 'warning', 'An error as occuried when creating the new project.');
    });	


};

$scope.deleteRow = function(){

    var project_indexes = $.map($('#projects_table').DataTable().rows('.selected').indexes(), function(index){
        return index;
    });
    
    for(i in project_indexes){

        var project_id = $scope.projects[project_indexes[i]].id;
        
        req = {
            url:'api/v1.0/projects/' + project_id,
            method:'DELETE'
        }

        $http(req).then(function(response){

            objects_utils.destroyTable('projects_table');
            var new_projects = [];
            $scope.projects.map(function(d){
                if (d.id != project_id) new_projects.push(d);
            })
            $scope.projects = new_projects;
            objects_utils.loadDataTables('projects_table', $scope.projects);
            objects_utils.show_message('projects_message_div', 'success', 'Project deleted.');

        });

    }

};


$scope.highlightProject = function($event, project_id){
    CURRENT_PROJECT_ID = project_id;
}

$scope.loadProject = function(table_id){

    var table = $('#' + table_id).DataTable();
    
    var selected_indexes = $.map(table.rows('.selected').indexes(), function(index){
        return index;
    });
    
    if (selected_indexes.length == 0){
        return objects_utils.show_message('projects_message_div', 'warning', 'Please select a project first.')
    }
    else{
        req = {
            url:'api/v1.0/projects/' + CURRENT_PROJECT_ID,
            method:'GET'
        }

        $http(req).then(function(response){
            console.log(response);
            CURRENT_PROJECT = response.data;
        });

        $scope.selectedTemplate.path = 'static/html_components/manage_projects_view.html';
    }

};

});