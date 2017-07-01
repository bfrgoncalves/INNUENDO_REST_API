innuendoApp.controller("workflowsCtrl", function($scope, $http) {

	$scope.added_protocols = {};
	$scope.class_options = ["Classifier", "Procedure"];

	var protocols = new Protocol_List($http);
	var workflows = new Workflows($http);
	var projects_table = new Projects_Table(0, null, $http);

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

			$("#protocol_type_selector_load").append(options);
			$(".selectpicker").selectpicker({});
			
			$("#protocol_type_selector_load").on("change", function(){
				$scope.loadProtocolType($("#protocol_type_selector_load option:selected").text());
			});
			
			workflows.set_protocol_types_object(results.protocolTypeObject);
		});

	}

	$scope.getSpecies = function(){

		projects_table.get_species_names(function(results){
	        $scope.species_options = results.species.map(function(d){
	        	return d.name;
	        });
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

		workflows.add_protocol_to_workflow($scope.selectedProtocolLoad, function(results){
			$scope.added_protocols = results.added_protocols;
		});
	}

	$scope.removeFromPipeline = function(selectedType){


	}


	$scope.add_New_Workflow = function(){

		workflows.save_workflow();

	}


});