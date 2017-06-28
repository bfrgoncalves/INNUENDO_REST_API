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
			workflows.set_protocol_types_object(results.protocolTypeObject);
		});

	}

	$scope.getSpecies = function(){

		projects_table.get_species_names(function(results){
	        $scope.species_options = results.species;
		});

	}

	$scope.loadProtocolType = function(selectedType){

		protocols.get_protocols_of_type(selectedType, function(results){
			workflows.set_protocols_of_type(results.protocols);
			$scope.property_fields = results.property_fields;
	    	$scope.protocols_of_type = results.protocols_of_type;
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