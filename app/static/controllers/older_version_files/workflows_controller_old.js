innuendoApp.controller("workflowsCtrl", function($scope, $http) {

	$scope.added_protocols = {};

	var protocolTypeObject = {};

	$scope.launch_sortable = function(){
		sortable('.sortable');
		$scope.getProtocolTypes();
	}

	$scope.getProtocolTypes = function(){

		req = {
	        url:'api/v1.0/ngsonto/protocols/types',
	        method:'GET'
	    }

	    $http(req).then(function(response){
	    	$scope.protocol_types = response.data.map(function(d){
	    		pname = d.protocTypeLabel.split('"')[1].replace(/'/g, "")
	    		console.log(pname)
	    		puri = d.protocType;
	    		protocolTypeObject[pname] = puri
	            return pname
	        });
	    });
	}

	$scope.loadProtocolType = function(selectedType){

		req = {
	        url:'api/v1.0/protocols/',
	        method:'GET',
	        params: { type: selectedType }
	    }

	    $http(req).then(function(response){
	    	$scope.property_fields = [];
	    	$scope.protocols_of_type = [];
	    	for(i in response.data){
	    		$scope.protocols_of_type.push(response.data[i].name);
	    		if (!protocols.hasOwnProperty(response.data[i].name)){
	    			protocols[response.data[i].name] = {};
	    		}
	    		ps = $.parseJSON(response.data[i].steps.replace(/'/g, '"'));
	    		for (j in ps){
	    			protocols[response.data[i].name][j] = ps[j];
	    		}
	    		protocols[response.data[i].name].id = response.data[i].id;


	    	}
	    }, function(response){
	    	console.log(response.statusText);
	    	$scope.protocols_of_type = [];
	    });
	}


	$scope.addToPipeline = function(){

		if(!$scope.added_protocols.hasOwnProperty($scope.selectedProtocolLoad)){
			$scope.added_protocols[$scope.selectedProtocolLoad] = protocols[$scope.selectedProtocolLoad]
		}
		console.log($scope.added_protocols[$scope.selectedProtocolLoad]);

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


	$scope.add_New_Workflow = function(){

		var values = $('#sortable_list li').map(function() {
		    return this.value;
		});
		list_values = values.get().join(',');
		
		req = {
	        url:'api/v1.0/workflows/',
	        method:'POST',
	        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
	        data: $('#new_workflow_form').serialize()
	    }

	    $http(req).then(function(response){
	    	console.log('DONE');
	    	ngs_onto_request(response.data.id, list_values);
	    }, function(response){
	    	console.log(response.statusText);
	    });



	    function ngs_onto_request(workflow_id, protocol_ids){
	    	req = {
		        url:'api/v1.0/ngsonto/workflows/protocols',
		        method:'POST',
		        data: {
		        	workflow_id: workflow_id,
		        	protocol_ids: protocol_ids
		        }
		    }

		    $http(req).then(function(response){
		    	console.log('DONE NGSOnto');
		    }, function(response){
		    	console.log(response.statusText);
		    });
	    }

	}


});