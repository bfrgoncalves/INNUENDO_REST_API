
innuendoApp.controller("configureAnalysisCtrl", function($scope, $rootScope, $http) {

	$('#waiting_spinner').css({display:'block', position:'fixed', top:'40%', left:'50%'});

	var pg_requests = new Requests(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http);
	var single_project = new Single_Project(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http, $rootScope);

	var jobs_to_reports = {};
	var strain_name_to_id = {};

	var current_p = "";


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

    $("#reset_strain").on("click", function(){
		$scope.$apply(function(){
			$scope.selectedTemplate.path = 'static/html_components/overview.html';
		})
	});

	$scope.showWorkflows = function(){

		single_project.get_workflows("Procedure", CURRENT_SPECIES_NAME, function(pipelines){
			console.log(pipelines);
			var to_show = "";
			pipelines.map(function(d){
				to_show += "<option name='"+d.name+"'>" + d.name + "</option>";
			});
			$("#select_job").append(to_show);
			$('.selectpicker').selectpicker({});
			$('#waiting_spinner').css({display:'none'});
			$('#configure_analysis_controller_div').css({display:'block'});

			$('#select_job').on("change", function(){
				var procedure_name = $(this).find(":selected").attr("name");
				var to_show = [];

				if(procedure_name.indexOf("chewBBACA") > -1){
					current_p = "chewBBACA";
					for (x in ANALYSYS_PARAMETERS["chewBBACA"]){
						to_show.push([x,ANALYSYS_PARAMETERS["chewBBACA"][x] == true ? "#c0ffee": "#ffffff", ANALYSYS_PARAMETERS["chewBBACA"][x]]);
					}
				}
				else if(procedure_name.indexOf("PathoTyping") > -1){
					current_p = "PathoTyping";
					for (x in ANALYSYS_PARAMETERS["PathoTyping"]){
						to_show.push([x,ANALYSYS_PARAMETERS["PathoTyping"][x] == true ? "#c0ffee": "#ffffff", ANALYSYS_PARAMETERS["PathoTyping"][x]]);
					}
				}
				else if(procedure_name.indexOf("INNUca") > -1){
					current_p = "INNUca";
					for (x in ANALYSYS_PARAMETERS["INNUca"]){
						to_show.push([x,ANALYSYS_PARAMETERS["INNUca"][x] == true ? "#c0ffee": "#ffffff", ANALYSYS_PARAMETERS["INNUca"][x]]);
					}
				}

				$scope.$apply(function(){
					$scope.analysis_fields = to_show;
				});

				$('.add_to_metadata_strain_button').on("click", function(){
					ANALYSYS_PARAMETERS[current_p][$(this).attr("key")] == true ? ANALYSYS_PARAMETERS[current_p][$(this).attr("key")] = false : ANALYSYS_PARAMETERS[current_p][$(this).attr("key")] = true;
					$('#select_job').trigger("change");
					pg_requests.set_user_parameters(JSON.stringify(ANALYSYS_PARAMETERS), function(response){
					});

				});

				$('.remove_from_metadata_strain_button').on("click", function(){
					ANALYSYS_PARAMETERS[current_p][$(this).attr("key")] == true ? ANALYSYS_PARAMETERS[current_p][$(this).attr("key")] = false : ANALYSYS_PARAMETERS[current_p][$(this).attr("key")] = true;
					$('#select_job').trigger("change");

					pg_requests.set_user_parameters(JSON.stringify(ANALYSYS_PARAMETERS), function(response){
					});

				});
			});

			//$('#select_job').trigger("change");

		});
	}

});