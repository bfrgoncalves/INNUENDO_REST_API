innuendoApp.controller("projectsCtrl", function($scope, $http) {


	$scope.projects = [];
    $scope.projects_headers = {};
    $scope.other_projects = [];
    $scope.species = [];
    $scope.currentSpecieID = 1;

    var projects_table = new Projects_Table(0, null, $http);
    var objects_utils = new Objects_Utils();

    if (get_userid() != 0){

        //Get user projects for specie 1
        projects_table.get_projects_from_species(1, false, function(results){
        	$scope.projects = results;
        	objects_utils.loadDataTables('projects_table', $scope.projects);
        });
        //Get other projects for specie 1
        projects_table.get_projects_from_species(1, true, function(results){
        	$scope.other_projects = results;
        	objects_utils.loadDataTables('other_projects_table', $scope.other_projects);
        });
        //Get species
        projects_table.get_species_names(function(results){
        	$scope.species = results.species;
	        CURRENT_SPECIES_NAME = results.CURRENT_SPECIES_NAME;
	        CURRENT_SPECIES_ID = results.CURRENT_SPECIES_ID;
        });
    }

	$scope.change_project_by_specie = function(species_id, species_name){

	    CURRENT_SPECIES_ID = species_id;
	    CURRENT_SPECIES_NAME = species_name;
	    $scope.currentSpecieID = species_id;

	    objects_utils.destroyTable('projects_table');
	    objects_utils.destroyTable('other_projects_table');

	    projects_table.get_projects_from_species(CURRENT_SPECIES_ID, false, function(results){
	    	$scope.projects = results;
	    	objects_utils.loadDataTables('projects_table', $scope.projects);
	    });

	    projects_table.get_projects_from_species(CURRENT_SPECIES_ID, true, function(results){
	    	$scope.other_projects = results;
	    	objects_utils.loadDataTables('other_projects_table', $scope.other_projects);
	    });

	};

	$scope.addRow = function(){

	    projects_table.add_project(function(results){
	    	console.log(results);
	    	$scope.projects = results.projects;
	    });

	};

	$scope.deleteRow = function(){

	    projects_table.delete_project(function(results){
	    	$scope.$apply(function(){
	    		objects_utils.destroyTable('projects_table');
	    		$scope.projects = results.projects;
	    		objects_utils.loadDataTables('projects_table', $scope.projects);
	    	})
	    })

	};

	$scope.highlightProject = function($event, project_id){
	    CURRENT_PROJECT_ID = project_id;
	}

	$scope.loadProject = function(table_id){
		projects_table.load_project(table_id, CURRENT_PROJECT_ID, function(results){
			CURRENT_PROJECT = results.project;
			$scope.selectedTemplate.path = results.template;
		});

	};

});