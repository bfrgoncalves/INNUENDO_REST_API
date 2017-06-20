innuendoApp.controller("projectsCtrl", function($scope, $http) {

	$('#waiting_spinner').css({display:'block', position:'fixed', top:'40%', left:'55%'});

	$("#projects_button_li").css({"display":"block"});
	$("#reports_button_li").css({"display":"block"});
	$("#uploads_button_li").css({"display":"block"}); 
	$("#workflows_button_li").css({"display":"none"});
	$("#protocols_button_li").css({"display":"none"});
	
	//$scope.projects = [];
    //$scope.projects_headers = {};
    //$scope.other_projects = [];
    var projects = [];
    
    var project_col_defs = [
    	{
            "className":      'select-checkbox',
            "orderable":      false,
            "data":           null,
            "defaultContent": ''
        },
        { "data": "name" },
        { "data": "description" },
        { "data": "date" }
    ];

    $scope.projects_headers = ['Name', 'Description', "Date"];

    var other_projects = [];

    $scope.species = [];
    $scope.currentSpecieID = CURRENT_SPECIES_ID;
    $scope.species_in_use = CURRENT_SPECIES_NAME;

    $("#current_species_nav").text(CURRENT_SPECIES_NAME);


    var projects_table = new Projects_Table(0, null, $http);
    var objects_utils = new Objects_Utils();

    if (get_userid() != 0){

        //Get user projects for specie 1
        projects_table.get_projects_from_species(CURRENT_SPECIES_ID, false, function(results){
        	//$scope.projects = results;
        	projects = results;
	    	console.log(results);
	    	objects_utils.loadDataTables('projects_table', projects, project_col_defs);
        	/*setTimeout(function(){
				objects_utils.loadDataTables('projects_table', $scope.projects);
			}, 2000);*/
			//Get other projects for specie 1
	        projects_table.get_projects_from_species(CURRENT_SPECIES_ID, true, function(results){
	        	other_projects = results;
		    	console.log(results);
		    	objects_utils.loadDataTables('other_projects_table', other_projects, project_col_defs);
	        	/*$scope.other_projects = results;
	        	objects_utils.loadDataTables('other_projects_table', $scope.other_projects);*/
	        	 //Get species
		        projects_table.get_species_names(function(results){
		        	$scope.species = results.species;
			        CURRENT_SPECIES_NAME = results.CURRENT_SPECIES_NAME;
			        CURRENT_SPECIES_ID = results.CURRENT_SPECIES_ID;

			        $('#projects_table').on('click', 'tr', function(){
			        	CURRENT_PROJECT_ID = projects[$(this).index()].id;
			        })

			        $('#other_projects_table').on('click', 'tr', function(){
			        	CURRENT_PROJECT_ID = other_projects[$(this).index()].id;
			        })

			        $('#waiting_spinner').css({display:'none'}); 
        			$('#project_controller_div').css({display:'block'}); 
        			$.fn.dataTable.tables( { visible: true, api: true } ).columns.adjust();
		        });
	        });
        });
        //Get other projects for specie 1
        /*projects_table.get_projects_from_species(1, true, function(results){
        	other_projects = results;
	    	console.log(results);
	    	objects_utils.loadDataTables('other_projects_table', other_projects, project_col_defs);
        	//$scope.other_projects = results;
        	//objects_utils.loadDataTables('other_projects_table', $scope.other_projects);
        });
        //Get species
        projects_table.get_species_names(function(results){
        	$scope.species = results.species;
	        CURRENT_SPECIES_NAME = results.CURRENT_SPECIES_NAME;
	        CURRENT_SPECIES_ID = results.CURRENT_SPECIES_ID;
        });

        $('#projects_table').on('click', 'tr', function(){
        	CURRENT_PROJECT_ID = projects[$(this).index()].id;
        })

        $('#other_projects_table').on('click', 'tr', function(){
        	CURRENT_PROJECT_ID = other_projects[$(this).index()].id;
        })

        setTimeout(function(){ 
        	$('#waiting_spinner').css({display:'none'}); 
        	$('#project_controller_div').css({display:'block'}); 
        	$.fn.dataTable.tables( { visible: true, api: true } ).columns.adjust();
    	}, 2000);*/
    }

	$scope.change_project_by_specie = function(species_id, species_name){

		$('#projects_container').css({display:"none"});
		$('#waiting_spinner').css({display:'block', position:'fixed', top:'40%', left:'55%'}); 

	    CURRENT_SPECIES_ID = species_id;
	    CURRENT_SPECIES_NAME = species_name;
	    $scope.currentSpecieID = species_id;

	    objects_utils.destroyTable('projects_table');
	    objects_utils.destroyTable('other_projects_table');

	    projects_table.get_projects_from_species(CURRENT_SPECIES_ID, false, function(results){
	    	//$scope.projects = results;
	    	projects = results;
	    	console.log(results);
	    	objects_utils.loadDataTables('projects_table', projects, project_col_defs, []);

	    	projects_table.get_projects_from_species(CURRENT_SPECIES_ID, true, function(results){
		    	//$scope.other_projects = results;
		    	other_projects = results;
		    	console.log(results);
		    	objects_utils.loadDataTables('other_projects_table', other_projects, project_col_defs, []);

		    	$('#projects_container').css({display:"block"});
				$('#waiting_spinner').css({display:'none'});
				$('#projects_table').DataTable().draw(); 
				$('#other_projects_table').DataTable().draw();
		    });
	    });

	    /*setTimeout(function(){
	    	$('#projects_container').css({display:"block"});
			$('#waiting_spinner').css({display:'none'});
			$('#projects_table').DataTable().draw(); 
			$('#other_projects_table').DataTable().draw(); 
	    }, 400);*/

	};

	$scope.addRow = function(){

	    projects_table.add_project(function(results){
	    	objects_utils.destroyTable('projects_table');
	    	projects = results.projects;
	    	console.log(projects);
	    	objects_utils.loadDataTables('projects_table', projects, project_col_defs, []);
	    	$('#projects_table').DataTable().draw(); 
	    });

	};

	$scope.deleteRow = function(){

	    projects_table.delete_project(function(results){
	    	//$scope.$apply(function(){
	    		objects_utils.destroyTable('projects_table');
	    		projects = results.projects;
	    		console.log(projects);
	    		objects_utils.loadDataTables('projects_table', projects, project_col_defs, []);
	    		$('#projects_table').DataTable().draw(); 

	    	//})
	    })

	};

	$scope.highlightProject = function($event, project_id){
	    CURRENT_PROJECT_ID = project_id;
	}

	$scope.loadProject = function(table_id){
		if(table_id == "other_projects_table") CURRENT_JOB_MINE = false;
		else CURRENT_JOB_MINE = true;
		projects_table.load_project(table_id, CURRENT_PROJECT_ID, false, function(results){
			CURRENT_PROJECT = results.project;
			$scope.selectedTemplate.path = results.template;
		});

	};

});