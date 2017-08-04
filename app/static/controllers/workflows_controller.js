innuendoApp.controller("workflowsCtrl", function($scope, $http) {

	current_scope_template = $scope.selectedTemplate.path;
	if(PREVIOUS_PAGE_ARRAY.length > 0) $("#backbutton").css({"display":"block"});
	else $("#backbutton").css({"display":"none"});

	$("#backbutton").off("click");
	$("#backbutton").on("click", function(){
		$scope.$apply(function(){
			$scope.selectedTemplate.path = PREVIOUS_PAGE_ARRAY.pop();
		})
	});

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

			setTimeout(function(){
				$(".current_workflow_close").on("click", function(){
					console.log("AQUI");
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