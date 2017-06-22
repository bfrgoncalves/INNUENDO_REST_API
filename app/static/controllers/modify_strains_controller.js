
innuendoApp.controller("modifyStrainsCtrl", function($scope, $rootScope, $http) {

	$('#waiting_spinner').css({display:'block', position:'fixed', top:'40%', left:'50%'});

	var objects_utils = new Objects_Utils();

	var metadata = new Metadata();

	single_project = new Single_Project(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http, $rootScope);

	metadata.add_owner(CURRENT_USER_NAME);


	$scope.metadata_fields = metadata.get_fields();
	$scope.specie_name = CURRENT_SPECIES_NAME;

	var strains_headers = metadata.get_minimal_fields();

	$scope.strains_headers = strains_headers;

	sh = strains_headers;

	var public_project_col_defs = [
    	{
            "className":      'select-checkbox',
            "orderable":      false,
            "data":           null,
            "defaultContent": ''
        },
        { "data": "strainID" },
        { "data": "species_id" },
        { "data": "source_Source" },
        { "data": "Location" },
        { "data": "SampleReceivedDate" },
        { "data": "SamplingDate" },
        { "data": "Submitter" },
        {
            "className":      'details-control',
            "orderable":      false,
            "data":           null,
            "defaultContent": '<div style="width:100%;text-align:center;"><button class="details-control"><i class="fa fa-info" data-toggle="tooltip" data-placement="top" title="More info"></i></button></div>'
        }

    ];

	var global_public_strains = [];

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

	$scope.showUserStrains = function(){
		$scope.getStrains();
	}

	$scope.getStrains = function(){

		single_project.get_strains(true, function(strains_results){
		    objects_utils.destroyTable('modify_strains_table');
		    global_public_strains = strains_results.public_strains;
		    objects_utils.loadDataTables('modify_strains_table', global_public_strains, public_project_col_defs, strains_headers);
		    $('#waiting_spinner').css({display:'none'});
		    $('#modify_strains_controller_div').css({display:'block'}); 
		});

	}


});