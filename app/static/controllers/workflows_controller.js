innuendoApp.controller("workflowsCtrl", function($scope, $http) {

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

	$scope.added_protocols = {};
	$scope.class_options = ["Classifier", "Procedure"];

	options=""
	for(x in $scope.class_options){
		options +="<option>"+$scope.class_options[x]+"</option>";
	}

	$("#select_classifier").empty();
	$("#select_classifier").append(options);
	$(".selectpicker").selectpicker({});
	$(".selectpicker").selectpicker("refresh");

	var protocols = new Protocol_List($http);
	var workflows = new Workflows($http);
	var projects_table = new Projects_Table(0, null, $http);
	var objects_utils = new Objects_Utils();


	var workflows_col_defs = [
    	{
            "className":      'select-checkbox',
            "orderable":      false,
            "data":           null,
            "defaultContent": ''
        },
        { "data": "id" },
        { "data": "name" },
        { "data": "classifier" },
        { "data": "species" },
        { "data": "availability" },
        { "data": "dependency" },
        { "data": "timestamp" }
    ];

    $scope.workflows_headers = ['ID', 'Name', 'Type', 'Species', 'Available', "Dependency", "Timestamp"];

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

	$scope.launch_sortable = function(){
		sortable('.sortable');
		$scope.getProtocolTypes();
		$scope.getSpecies();

		workflows.get_all_workflows(function(results){

			$scope.workflows_names = [];
			options = "";

			options +="<option>None</option>";
			for (x in results.data){
				options +="<option>"+results.data[x].name+"</option>";
			}

			$("#select_dependency").empty();
			$("#select_dependency").append(options);

	    	objects_utils.loadDataTables('workflows_table', results.data, workflows_col_defs);
	    });
	}

	$scope.changeWorkflowState = function(){
		workflows.change_workflow_state(function(){
			workflows.get_all_workflows(function(results){
				objects_utils.destroyTable('workflows_table');
		    	objects_utils.loadDataTables('workflows_table', results.data, workflows_col_defs);
		    });
		});
	}

	const updateWorkflows = () => {
		workflows.get_all_workflows(function(results){
			objects_utils.destroyTable('workflows_table');
	    	objects_utils.loadDataTables('workflows_table', results.data, workflows_col_defs);
	    });
	}

	$scope.getProtocolTypes = function(){

		protocols.get_protocol_types(function(results){
			$scope.protocol_types = results.protocol_types;

			options="";
			for(x in results.protocol_types){
				options +="<option>"+results.protocol_types[x]+"</option>";
			}

			$("#protocol_type_selector_load").empty();
			$("#protocol_type_selector_load").append(options);
			$(".selectpicker").selectpicker({});
			$(".selectpicker").selectpicker("refresh");
			
			$("#protocol_type_selector_load").on("change", function(){
				$scope.loadProtocolType($("#protocol_type_selector_load option:selected").text());
			});

			$("#protocol_type_selector_load").trigger("change");
			
			workflows.set_protocol_types_object(results.protocolTypeObject);
		});

	}

	$scope.getSpecies = function(){

		projects_table.get_species_names(function(results){
			options=""
	        results.species.map(function(d){
	        	options += "<option>"+d.name+"</option>";
	        	//return d.name;
	        });

	        $("#workflow_species").empty();
	        $("#workflow_species").append(options);
	        $(".selectpicker").selectpicker({});
	        $(".selectpicker").selectpicker("refresh");

		});

	}

	$scope.loadProtocolType = function(selectedType){

		$("#div_button_addto_workflow").css({display:"none"});

		protocols.get_protocols_of_type(selectedType, function(results){
			workflows.set_protocols_of_type(results.protocols);
			$scope.property_fields = results.property_fields;
			//$scope.protocols_of_type = results.protocols_of_type;

			options = "";
	    	for(x in results.protocols_of_type){
				options +="<option>"+results.protocols_of_type[x]+"</option>";
			}

			$("#protocol_selector_load").empty();
			$("#protocol_selector_load").append(options);
			$(".selectpicker").selectpicker("refresh");

			$("#protocol_selector_load").on("change", function(){
				$("#div_button_addto_workflow").css({display:"block"});
			});

			if(results.protocols.length != 0) $("#protocol_selector_load").trigger("change");
		});
	}


	$scope.addToPipeline = function(){

		workflows.add_protocol_to_workflow($("#protocol_selector_load option:selected").text(), function(results){
			if(results.more_than_one == true) modalAlert("At the moment, only one protocol can be applied to the workflow. We will improve this option in the near future.", function(){
				$scope.added_protocols = results.added_protocols;
			});
			else $scope.added_protocols = results.added_protocols;

			setTimeout(function(){
				$(".current_workflow_close").on("click", function(){
					$scope.removeFromPipeline($(this).closest("li").attr("protocol_name"))
				});
			}, 800);
		});
	}

	$scope.removeFromPipeline = function(protocol_name){

		console.log(protocol_name);

		workflows.remove_protocol_from_workflow(protocol_name, function(results){
			console.log(results.added_protocols);
			$scope.$apply(function(){
				$scope.added_protocols = results.added_protocols;
			})
			modalAlert("The protocol was removed from the workflow.", function(){
			});
		});

	}


	$scope.add_New_Workflow = function(){

		workflows.save_workflow(function(status){

			updateWorkflows();
			
			if(status == true){
				modalAlert("Workflow saved.", function(){
				});
			}
			else{
				modalAlert("An error as occurried when saving the workflow.", function(){
				});
			}
		});

	}


});