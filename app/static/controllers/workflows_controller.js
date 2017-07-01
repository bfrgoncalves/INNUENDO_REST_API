innuendoApp.controller("workflowsCtrl", function($scope, $http) {

	$scope.added_protocols = {};
	$scope.class_options = ["Classifier", "Procedure"];

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

	function modalAlert(text, callback){

    	$('#modalAlert #buttonSub').off("click");
    	$('#modalAlert .modal-body').empty();
    	$('#modalAlert .modal-body').append("<p>"+text+"</p>");

    	$('#modalAlert #buttonSub').on("click", function(){
    		$("#buttonCancelAlert").click();
    		setTimeout(function(){callback()}, 400);
    	})

    	$('#modalAlert').modal("show");

    }

	$scope.launch_sortable = function(){
		sortable('.sortable');
		$scope.getProtocolTypes();
		$scope.getSpecies();
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
		});
	}

	$scope.removeFromPipeline = function(selectedType){


	}


	$scope.add_New_Workflow = function(){

		workflows.save_workflow();

	}


});