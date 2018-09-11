
innuendoApp.controller("configureAnalysisCtrl", function($scope, $rootScope, $http) {

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
			PROJECT_STATUS = session_array[12];

			$scope.selectedTemplate.path = session_array[0];
		});
	});

	//RESET ROW SELECTION
	CURRENT_TABLE_ROW_ANALYSIS_SELECTED = {};
	CURRENT_TABLE_ROWS_SELECTED = {};

	$('#waiting_spinner').css({display:'block', position:'fixed', top:'40%', left:'50%'});

	var pg_requests = new Requests(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http);
	var single_project = new Single_Project(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http, $rootScope);

	var current_p = "";

    $("#reset_strain").on("click", function(){
		$scope.$apply(function(){
			$scope.selectedTemplate.path = 'static/html_components/overview.html';
		});
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

			setTimeout(function(){$('#select_job').trigger("change");}, 100);

		});
	}

});