innuendoApp.controller("protocolsCtrl", function($scope, $http) {

	var file_formats = ["fastq", "gbk", "bam", "sam"];

	var protocolTypeObject = {};
	var protocols = {};
	var selectedProtocolType = '';
	var selectedNewProtocolType = '';
	var currentProtocolType = '';

	$scope.protocol_type = {};
	$scope.protocols_of_type = [];
	$scope.protocolTypeParameters = {};

$scope.loadProtocols = function(){
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
    		puri = d.protocType;
    		protocolTypeObject[pname] = puri
            return pname
        });
    });
}

$scope.addProtocol = function(){
	form_serialized = $('#new_protocol_form').serializeArray();

	var protocol_object = {};
	
	if ( $( "#parameter_select" ).length ) {
 
 		var options = $('#parameter_select option');
 		var values = {};
		$.map(options ,function(option) {
			parts = option.value.split(':');
		    values[parts[0]] = parts[1];
		});

		protocol_object['used Parameter'] = values;
	}
	protocol_object['protocol_type'] = currentProtocolType;

	for (i in form_serialized){
		protocol_object[form_serialized[i].name.split('_')[1]] = form_serialized[i].value;
	}

	/*if(!protocols.hasOwnProperty(selectedNewProtocolType)){
		protocols[selectedNewProtocolType] = {};
	}
	protocols[selectedNewProtocolType][protocol_object.Name] = protocol_object;
	console.log('protocol created');*/

	req = {
        url:'api/v1.0/protocols/',
        method:'POST',
        headers: {'Content-Type': 'application/json'},
        data: { steps: protocol_object, name: protocol_object.name}
    }

    $http(req).then(function(response){
    	console.log('Protocol Added');
    	new_protocol_id = response.data.id;
    	ngs_onto_protocol(currentProtocolType, new_protocol_id);
    });

    function ngs_onto_protocol(typeuri, protocol_id){

    	req = {
	        url:'api/v1.0/ngsonto/protocols/',
	        method:'POST',
	        headers: {'Content-Type': 'application/json'},
	        data: { type_uri: protocolTypeObject[typeuri], protocol_id: protocol_id}
	    }

	    $http(req).then(function(response){
	    	console.log('Protocol Added to ngs_onto');
	    });

    }



}

$scope.loadProtocolCreator = function(selectedType){
	selectedNewProtocolType = selectedType;
	currentProtocolType = selectedNewProtocolType;
    console.log(protocolTypeObject[selectedNewProtocolType]);

	req = {
        url:'api/v1.0/ngsonto/protocols/properties',
        method:'GET',
        params: { uri: protocolTypeObject[selectedNewProtocolType] }
    }

    $http(req).then(function(response){
    	$scope.protocol_type = {};
    	$scope.protocol_parameters = [];
    	for(i in response.data){
    		protocolProperty = response.data[i].plabel.split('"')[1]
    		protocolUri = response.data[i].rangeClass
    		$scope.protocol_type[protocolProperty] = processProtocolForm(protocolProperty, protocolUri);
    	}
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
            console.log(ps);
    		for (j in ps){
    			protocols[response.data[i].name][j] = ps[j];
    		}

    	}
    }, function(response){
    	console.log(response.statusText);
    	$scope.protocols_of_type = [];
    });
}

$scope.loadProtocol = function(selectedProtocol){

    console.log(protocols[selectedProtocol]);

	$scope.selected_protocol = protocols[selectedProtocol];

}

function processProtocolForm(property, uri){

	if(property == 'used Parameter'){
		return ["button", "text", uri];
	}
	return ["input", "text"];

}

$scope.getProtocolFields = function(uri){

	req = {
        url:'api/v1.0/ngsonto/protocols/properties/fields',
        method:'GET',
        params: { uri: uri }
    }

    $http(req).then(function(response){
    	$scope.property_fields = [];
        property_fields = [];
    	for(i in response.data){
    		property_fields.push(response.data[i].plabel.split('"')[1])
    	}
        property_fields = property_fields.reverse();
        $scope.property_fields = property_fields;
    });

    $('#newProtocolModal').modal('show');
}

$scope.AddParameters = function(){

	var parameterObject = $('#new_data_form').serializeArray();
	if (!$scope.protocolTypeParameters.hasOwnProperty(currentProtocolType)){
		$scope.protocolTypeParameters[currentProtocolType] = [];
	}
	$scope.protocolTypeParameters[currentProtocolType].push(parameterObject);
	$scope.protocol_parameters = $scope.protocolTypeParameters[currentProtocolType];

}


});