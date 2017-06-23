
innuendoApp.controller("overviewCtrl", function($scope, $rootScope, $http) {

	$scope.showSpeciesDrop = function(){

		$("#projects_button_li").css({"display":"none"});
		$("#reports_button_li").css({"display":"none"});
		$("#uploads_button_li").css({"display":"none"});
		$("#tools_button_li").css({"display":"none"});
		$("#workflows_button_li").css({"display":"block"});
		$("#protocols_button_li").css({"display":"block"});
		$("#species_drop_button_li").css({"display":"none"});
		$("#overview_li").css({"display":"block"});

		var projects_table = new Projects_Table(0, null, $http);
		var pg_requests = new Requests(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http);

		if(CURRENT_USER_NAME == ""){
			$("#load_species_row").css({"display":"none"});
		}
		else{

			projects_table.get_species_names(function(results){
	        	$scope.species = results.species;
		        CURRENT_SPECIES_NAME = results.CURRENT_SPECIES_NAME;
		        CURRENT_SPECIES_ID = results.CURRENT_SPECIES_ID;

		        console.log(CURRENT_SPECIES_NAME, CURRENT_SPECIES_ID, results.species);

		        var t_use = "";
				for(r in results.species){
					t_use += '<option species_id="'+results.species[r].id+'">' + results.species[r].name + '</option>';
				}
				$('#species_select_drop').append(t_use);

				$('.selectpicker').selectpicker({});


	        });
		}

		pg_requests.get_user_parameters(function(response){
			console.log(response);
			ANALYSYS_PARAMETERS = JSON.parse(response.data.analysis_parameters_object);
			console.log(ANALYSYS_PARAMETERS);
		});

	}

	$scope.load_species = function(){
    	CURRENT_SPECIES_NAME = $('#species_select_drop option:selected').text();
        CURRENT_SPECIES_ID = $('#species_select_drop option:selected').attr("species_id");
        $scope.selectedTemplate.path = 'static/html_components/projects_view.html';
	}

});