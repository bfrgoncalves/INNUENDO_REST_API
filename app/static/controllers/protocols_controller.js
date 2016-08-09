innuendoApp.controller("protocolsCtrl", function($scope, $http) {

	protocol_types = ["Software", "Assembly"];
	$scope.protocol_types = protocol_types;

	var file_formats = ["fastq", "gbk", "bam", "sam"];

	//var protocols = {};
	var selectedProtocolType = '';
	var selectedNewProtocolType = '';

	var protocol_fields = {

		"Software": {
			"Name": ["input", "text"],
			"Version": ["input", "text"],
			"Description": ["textarea", "text"],
			"Input": ["select", file_formats],
			"Output": ["select", file_formats]
		},
		"Assembly": {
			"Name": ["input", "text"],
			"Version": ["input", "text"],
			"Platform": ["input", "text"],
			"Description": ["textarea", "text"],
			"Input": ["select", file_formats],
			"Output": ["select", file_formats]
		}

	}

	$scope.protocol_type = {};
	$scope.protocols_of_type = [];


$scope.addProtocol = function(){
	form_serialized = $('#new_protocol_form').serializeArray();
	var protocol_object = {};
	for (i in form_serialized){
		protocol_object[form_serialized[i].name.split('_')[1]] = form_serialized[i].value;
	}

	if(!protocols.hasOwnProperty(selectedNewProtocolType)){
		protocols[selectedNewProtocolType] = {};
	}
	protocols[selectedNewProtocolType][protocol_object.Name] = protocol_object;
	console.log('protocol created');

}

$scope.loadProtocolCreator = function(selectedType){
	selectedNewProtocolType = selectedType;
	$scope.protocol_type = protocol_fields[selectedType];
}

$scope.loadProtocolType = function(selectedType){

	if(protocols.hasOwnProperty(selectedType)){
		$scope.protocols_of_type = Object.keys(protocols[selectedType]);
		selectedProtocolType = selectedType;
	}
	else $scope.protocols_of_type = [];
}

$scope.loadProtocol = function(selectedProtocol){

	$scope.selected_protocol = protocols[selectedProtocolType][selectedProtocol];

}


});