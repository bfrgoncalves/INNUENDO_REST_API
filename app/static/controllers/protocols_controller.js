innuendoApp.controller("protocolsCtrl", function($scope, $http) {

	$scope.required = true;

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

	$scope.protocol_type = {};
	$scope.protocols_of_type = [];
	$scope.protocolTypeParameters = {};

	var protocols_list = new Protocol_List($http);

	var usedSoftware = ["INNUca", "chewBBACA", "PathoTyping", "integrity_coverage", "fastqc", "trimmomatic", "integrity_coverage_2", "fastqc2", "spades", "process_spades", "assembly_mapping", "process_assembly_mapping", "pilon", "mlst", "prokka", "abricate", "seq_typing", "patho_typing"];
	var nextflow_tags = ["integrity_coverage", "check_coverage", "fastqc", "trimmomatic", "fastqc_trimmomatic", "spades", "process_spades", "assembly_mapping", "pilon", "mlst", "abricate", "prokka", "chewbbaca", "seq_typing", "patho_typing"];


	$scope.loadProtocols = function(){
		$scope.getProtocolTypes();
	}

	$scope.getProtocolTypes = function(){

		protocols_list.get_protocol_types(function(results){
			$scope.protocol_types = results.protocol_types;
			options="";
			for(x in results.protocol_types){
				options +="<option>"+results.protocol_types[x]+"</option>";
			}

			$("#protocol_type_selector").empty();
			$("#protocol_type_selector_load").empty();
			$("#protocol_type_selector").append(options);
			$("#protocol_type_selector_load").append(options);
			$(".selectpicker").selectpicker({});
			
			$("#protocol_type_selector").on("change", function(){
				$scope.loadProtocolCreator($("#protocol_type_selector option:selected").text());
			});
			$("#protocol_type_selector_load").on("change", function(){
				$scope.loadProtocolType($("#protocol_type_selector_load option:selected").text());
			});

			$("#protocol_type_selector").trigger("change");
			$("#protocol_type_selector_load").trigger("change");
		});
	}

	$scope.addProtocol = function(){

		protocols_list.add_protocol(function(results){
			console.log(results.message);
		});

	}

	$scope.loadProtocolCreator = function(selectedType){

		$("#new_protocol_form").css({"display":"none"});

		protocols_list.load_protocol_form(selectedType, function(results){
			$(".to_empty").val("");
			$('.to_empty option').remove();
			$(".selectpicker").selectpicker("refresh");
	    	$scope.protocol_parameters = results.protocol_parameters;
	    	$scope.protocol_type = results.protocol_type;
	    	$("#create_protocol_button").css({"display":"block"});

	    	setTimeout(function(){
	    		if($.inArray("used Software", results.protocol_parameters)){
		    		options = "";
		    		options_nextflow = "";
		    		for(x in usedSoftware){
		    			options += "<option>"+usedSoftware[x]+"</option>";
		    		}
		    		for(y in nextflow_tags){
		    			options_nextflow += "<option>"+nextflow_tags[y]+"</option>";
		    		}
		    		$('#select_software').empty();
		    		$('#select_software').append(options);
		    		$('#nextflow_tag').empty();
		    		$('#nextflow_tag').append(options_nextflow);
		    		$(".selectpicker").selectpicker({});
		    		$("#new_protocol_form").css({"display":"block"});
		    	}
	    	}, 600);
		});
	}

	$scope.loadProtocolType = function(selectedType){

		protocols_list.get_protocols_of_type(selectedType, function(results){
			console.log(results);
			console.log(results);
			$scope.property_fields = results.property_fields;
	    	//$scope.protocols_of_type = results.protocols_of_type;
	    	options = "";
	    	for(x in results.protocols_of_type){
				options +="<option>"+results.protocols_of_type[x]+"</option>";
			}

			$("#protocol_selector_load").empty();
			$("#protocol_selector_load").append(options);
			$(".selectpicker").selectpicker("refresh");

			$("#protocol_selector_load").off("change");
			
			$("#protocol_selector_load").on("change", function(){
				protocols_list.load_protocol($("#protocol_selector_load option:selected").text(), function(results){
					$scope.$apply(function(){
						$scope.selected_protocol = results.protocol;
					})
					$("#div_protocol_show").css({display:"block"});
				});
			});

			setTimeout(function(){$("#protocol_selector_load").trigger("change");},300);


		});
	}

	$scope.loadProtocol = function(selectedProtocol){

		$("#div_protocol_show").css({display:"none"});

		protocols_list.load_protocol(selectedProtocol, function(results){
			$scope.selected_protocol = results.protocol;
			$("#div_protocol_show").css({display:"block"});
		});

	}

	$scope.getProtocolFields = function(uri){

		protocols_list.get_protocol_fields(uri, function(results){
			console.log(results);
			$scope.property_fields = results.property_fields.reverse();
		});
	}

	$scope.removeSelectedParameter = function(){

		var selected_text = $("#parameter_select option:selected").text();
		new_options = "";
		protocols_list.get_current_protocol_type(function(results){
			var currentProtocolType = results.currentProtocolType;
			var new_protocolParameters = [];
			for(x in $scope.protocolTypeParameters[currentProtocolType]){
				to_check = $scope.protocolTypeParameters[currentProtocolType][x][0].value+":"+$scope.protocolTypeParameters[currentProtocolType][x][1].value;
				if(to_check != selected_text){
					new_options += "<option>"+to_check+"</option>";
					new_protocolParameters.push($scope.protocolTypeParameters[currentProtocolType][x]);
				}
			}

			$scope.protocolTypeParameters[currentProtocolType] = new_protocolParameters;
			
			$('#parameter_select').empty();
			$("#parameter_select").append(new_options);
			$(".selectpicker").selectpicker("refresh");
		});

	}

	$scope.AddParameters = function(){

		protocols_list.get_current_protocol_type(function(results){
			var parameterObject = $('#new_data_form').serializeArray();
			var currentProtocolType = results.currentProtocolType;
			if (!$scope.protocolTypeParameters.hasOwnProperty(currentProtocolType)){
				$scope.protocolTypeParameters[currentProtocolType] = [];
			}
			$scope.protocolTypeParameters[currentProtocolType].push(parameterObject);
			$scope.protocol_parameters = $scope.protocolTypeParameters[currentProtocolType];

			option = "";
			for(x in $scope.protocolTypeParameters[currentProtocolType]){
				option += "<option>"+$scope.protocolTypeParameters[currentProtocolType][x][0].value+":"+$scope.protocolTypeParameters[currentProtocolType][x][1].value+"</option>";
			}

			$('#parameter_select').empty();
			$('.entered_params').val("");
			$("#parameter_select").append(option);
			$(".selectpicker").selectpicker("refresh");

		});

	}


});