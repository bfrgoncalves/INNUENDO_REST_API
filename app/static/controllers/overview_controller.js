
innuendoApp.controller("overviewCtrl", function($scope, $rootScope, $http) {

	$scope.showSpeciesDrop = function(){

		var projects_table = new Projects_Table(0, null, $http);

		projects_table.get_species_names(function(results){
        	$scope.species = results.species;
	        CURRENT_SPECIES_NAME = results.CURRENT_SPECIES_NAME;
	        CURRENT_SPECIES_ID = results.CURRENT_SPECIES_ID;

	        console.log(CURRENT_SPECIES_NAME, CURRENT_SPECIES_ID, results.species);

	        var t_use = "";
			for(r in results.species){
				t_use += '<option>' + results.species[r].name + '</option>';
			}
			$('#species_select_drop').append(t_use);

			$('.selectpicker').selectpicker({
			});


        });

	}

});