
innuendoApp.controller("configureAnalysisCtrl", function($scope, $rootScope, $http) {

	$('#waiting_spinner').css({display:'block', position:'fixed', top:'40%', left:'50%'});

	var objects_utils = new Objects_Utils();

	var metadata = new Metadata();

	single_project = new Single_Project(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http, $rootScope);
	reports = new Report($http);

	metadata.add_owner(CURRENT_USER_NAME);

	var jobs_to_reports = {};
	var strain_name_to_id = {};


	$scope.metadata_fields = metadata.get_fields();
	$scope.specie_name = CURRENT_SPECIES_NAME;


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
		single_project.get_workflows("Procedure", function(pipelines){
			console.log(pipelines);
			var to_show = "";
			pipelines.map(function(d){
				to_show += "<option>" + d.name + "</option>";
			});
			$("#select_job").append(to_show);
			$('.selectpicker').selectpicker({});
			$('#waiting_spinner').css({display:'none'});
			$('#configure_analysis_controller_div').css({display:'block'});
		});

	}

});