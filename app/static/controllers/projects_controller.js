/*
Projects controller - Controller of the projects page. 
Uses:
	- projects_table object
	- object_utis object
*/

innuendoApp.controller("projectsCtrl", function($scope, $http) {

	current_scope_template = $scope.selectedTemplate.path;
	if(PREVIOUS_PAGE_ARRAY.length > 0) $("#backbutton").css({"display":"block"});

	$('#waiting_spinner').css({display:'block', position:'fixed', top:'40%', left:'50%'});

	$("#projects_button_li").css({"display":"block"});
	$("#reports_button_li").css({"display":"block"});
	$("#uploads_button_li").css({"display":"block"});
	$("#tools_button_li").css({"display":"block"}); 
	$("#species_drop_button_li").css({"display":"block"});
	$("#protocols_button_li").css({"display":"none"});
	$("#workflows_button_li").css({"display":"none"});
	$("#overview_li").css({"display":"none"});

	//Reset application to overview page. Allows to select a diferent species
	$("#reset_strain").on("click", function(){
		$scope.$apply(function(){
			$scope.selectedTemplate.path = 'static/html_components/overview.html';
		})
	});

	function modalAlert(text, callback){

    	$('#buttonSub').off("click");
    	$('#buttonCancelAlert').off("click");

    	$('#modalAlert .modal-body').empty();
    	$('#modalAlert .modal-body').append("<p>"+text+"</p>");

    	$('#buttonSub').one("click", function(){
    		$('#modalAlert').modal("hide");
    		console.log("Alert");

    		setTimeout(function(){return callback()}, 400);
    	})

    	$('#modalAlert').modal("show");

    }
	
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

        //Get available projects for the selected species of the current user
        projects_table.get_projects_from_species(CURRENT_SPECIES_ID, false, function(results){
        	projects = results;
	    	objects_utils.loadDataTables('projects_table', projects, project_col_defs);

			//Get available projects for the selected species of the other users
	        projects_table.get_projects_from_species(CURRENT_SPECIES_ID, true, function(results){
	        	other_projects = results;
		    	objects_utils.loadDataTables('other_projects_table', other_projects, project_col_defs);
		    	$('#waiting_spinner').css({display:'none'}); 
    			$('#project_controller_div').css({display:'block'}); 
    			$.fn.dataTable.tables( { visible: true, api: true } ).columns.adjust();

    			//Sets the CURRENT_PROJECT_ID to be loaded later
    			$('#projects_table').on('click', 'tr', function(){
		        	CURRENT_PROJECT_ID = projects[$(this).index()].id;
		        })

		        $('#other_projects_table').on('click', 'tr', function(){
		        	CURRENT_PROJECT_ID = other_projects[$(this).index()].id;
		        })

	        });
        });
    }

    /*
    Add a new project of the current species
    */
	$scope.addRow = function(){

	    projects_table.add_project(function(results){
	    	objects_utils.destroyTable('projects_table');
	    	projects = results.projects;
	    	objects_utils.loadDataTables('projects_table', projects, project_col_defs, []);
	    	$('#projects_table').DataTable().draw(); 
	    });

	};

	/*
    Delete a project of the current species
    */
	$scope.deleteRow = function(){

	    projects_table.delete_project(function(results){
    		objects_utils.destroyTable('projects_table');
    		projects = results.projects;
    		objects_utils.loadDataTables('projects_table', projects, project_col_defs, []);
    		$('#projects_table').DataTable().draw(); 
	    })

	};

	/*
    Sets the CURRENT_PROJECT_ID selected
    */
	$scope.highlightProject = function($event, project_id){
	    CURRENT_PROJECT_ID = project_id;
	}

	/*
    Loads the selected project.
    */
	$scope.loadProject = function(table_id){
		if(table_id == "other_projects_table") CURRENT_JOB_MINE = false;
		else CURRENT_JOB_MINE = true;
		projects_table.load_project(table_id, CURRENT_PROJECT_ID, false, function(results){
			CURRENT_PROJECT = results.project;
			$scope.selectedTemplate.path = results.template;
		});

	};

});