/*
Projects controller - Controller of the projects page. 
Uses:
	- projects_table object
	- object_utis object
*/

innuendoApp.controller("projectsCtrl", function($scope, $http) {

	current_scope_template = $scope.selectedTemplate.path;
	if(PREVIOUS_PAGE_ARRAY.length > 0) $("#backbutton").css({"display":"block"});
	else $("#backbutton").css({"display":"none"});


	$("#backbutton").off("click");
	$("#backbutton").on("click", function(){
		$scope.$apply(function(){
			session_array = PREVIOUS_PAGE_ARRAY.pop();

			CURRENT_PROJECT_ID = session_array[1];
			CURRENT_JOB_MINE = session_array[2];
			CURRENT_PROJECT = session_array[3];
			CURRENT_SPECIES_ID = session_array[4];
			CURRENT_SPECIES_NAME = session_array[5];
			CURRENT_USER_NAME = session_array[6];
			CURRENT_JOBS_ROOT = session_array[7];

			CURRENT_JOB_ID = session_array[8];
			CURRENT_PROJECT_NAME_ID = session_array[9];
			CURRENT_TABLE_ROWS_SELECTED = session_array[10];
			CURRENT_TABLE_ROW_ANALYSIS_SELECTED = session_array[11];

			$scope.selectedTemplate.path = session_array[0];
		})
	});

	//RESET ROW SELECTION
	CURRENT_TABLE_ROW_ANALYSIS_SELECTED = {}
	CURRENT_TABLE_ROWS_SELECTED = {}

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

	const resetHomeOpts = () => {

	    const optsDiv = $("#optsContainer");
	    for (const el of optsDiv.children()) {
	        $(el).css({"display": "none"});
	    }
	};


	/**
	 * Provides the toggle behaviour of the project
	 * selection/loading in the Innuendo home page.
	 * The behavior is bound to the "click" event of the
	 * main toggle buttons and is responsible for showing the
	 * corresponding div element.
	 */
	const initHomeButtonsToggle = () => {

	    const homeButtons = [
	        "#btProjectSelect",
	        "#btProjectLoad"
	    ];

	    for (const bt of homeButtons) {

	        const btDiv = $(bt);
	        const targetDiv = $("#" + btDiv.data("target"));

	        btDiv.on("click", () => {
	        	console.log("AQUI");
	            resetHomeOpts();
	            targetDiv.css({"display": "inline-block"})

	        });
	    }
	};

	initHomeButtonsToggle();

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
    var name_to_project = {};
    
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
    var name_to_other_project = {};

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
        	
        	for (x in projects) {
        		name_to_project[projects[x].name] = projects[x].id;
        	}

	    	objects_utils.loadDataTables('projects_table', projects, project_col_defs);

			//Get available projects for the selected species of the other users
	        projects_table.get_projects_from_species(CURRENT_SPECIES_ID, true, function(results){
	        	other_projects = results;

	        	for (x in other_projects) {
	        		name_to_other_project[other_projects[x].name] = other_projects[x].id;
	        	}

		    	objects_utils.loadDataTables('other_projects_table', other_projects, project_col_defs);
		    	$('#waiting_spinner').css({display:'none'}); 
    			$('#project_controller_div').css({display:'block'}); 
    			$.fn.dataTable.tables( { visible: true, api: true } ).columns.adjust();

    			//Sets the CURRENT_PROJECT_ID to be loaded later
    			$('#projects_table').on('click', 'tr', function(){
    				console.log($('#projects_table').DataTable().row( this ).data());
		        	CURRENT_PROJECT_ID = $('#projects_table').DataTable().row( this ).data().id;
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
			PREVIOUS_PAGE_ARRAY.push([current_scope_template, CURRENT_PROJECT_ID, CURRENT_JOB_MINE, CURRENT_PROJECT, CURRENT_SPECIES_ID, CURRENT_SPECIES_NAME, CURRENT_USER_NAME, CURRENT_JOBS_ROOT, CURRENT_JOB_ID, CURRENT_PROJECT_NAME_ID, CURRENT_TABLE_ROWS_SELECTED, CURRENT_TABLE_ROW_ANALYSIS_SELECTED]);
			$scope.selectedTemplate.path = results.template;
		});

	};

});