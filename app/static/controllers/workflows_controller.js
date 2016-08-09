innuendoApp.controller("workflowsCtrl", function($scope, $http) {

	$scope.added_protocols = {};

	$scope.launch_sortable = function(){
		sortable('.sortable');
		$scope.protocol_types = protocol_types;
		console.log(protocols);
	}

	$scope.loadProtocolType = function(selectedType){

		if(protocols.hasOwnProperty(selectedType)){
			$scope.protocols_of_type = Object.keys(protocols[selectedType]);
			selectedProtocolType = selectedType;
		}
		else $scope.protocols_of_type = [];
	}

	$scope.addToPipeline = function(){

		if(!$scope.added_protocols.hasOwnProperty($scope.selectedProtocolLoad)){
			$scope.added_protocols[$scope.selectedProtocolLoad] = protocols[$scope.selectedTypeLoad][$scope.selectedProtocolLoad]
		}

		if(Object.keys($scope.added_protocols).length > 0){
			$('#workflow_form_block').css({display:'block'});
		}
		else $('#workflow_form_block').css({display:'none'});
		
		setTimeout(function(){
			sortable('.sortable');
		}, 100);

		
	}

	$scope.removeFromPipeline = function(selectedType){


	}

});