

function set_headers_metadata(global_strains, procedure){
	var metadata = new Metadata();
	matching_fields = metadata.get_dict_fields_reverse();
	minimal_fields = metadata.get_default_headers();
	var strains_headers = []

	if(global_strains.length == 0){

		var p_col_defs = [
	    	{
	            "className":      'select-checkbox',
	            "orderable":      false,
	            "data":           null,
	            "defaultContent": ''
	        },
	        { "data": "Sample" },
	        { "data": "job_id" }

	    ];

	    strains_headers = ["Sample","Run Identifier"]
	}
	else if(procedure != null && procedure.indexOf("results_info_chewBBACA") > -1){

		var p_col_defs = [
	    	{
	            "className":      'select-checkbox',
	            "orderable":      false,
	            "data":           null,
	            "defaultContent": ''
	        },
	        { "data": "Sample" },
	        { "data": "job_id" },
	        {
	            "className":      'get_results',
	            "orderable":      false,
	            "data":           null,
	            "defaultContent": '<div><button class="analysis-control btn-warning" onclick="download_profile(this)">Profile</button></div>'
	        }

	    ];

	    strains_headers = ["Sample","Run Identifier", "Results"]
	}
	else{

		var p_col_defs = [
			{
	            "className":      'select-checkbox',
	            "orderable":      false,
	            "data":           null,
	            "defaultContent": ''
	        }
		];
		
		for(x in global_strains[0]){
			if (x != "Analysis" && x != "id" && x != "species_id" && x != "strain_id" && x != "FilesLocation"){
				p_col_defs.push({"data":x, "visible":true});
				strains_headers.push(matching_fields[x] == undefined ? x:matching_fields[x]);
			}
		}		
	}

    return [p_col_defs, strains_headers]
}





innuendoApp.controller("modifyStrainsCtrl", function($scope, $rootScope, $http) {

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

	var strains_headers = metadata.get_minimal_fields();

	$scope.strains_headers = strains_headers;

    $scope.species_id = CURRENT_SPECIES_ID;

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
        {
            "className":      'details-control',
            "orderable":      false,
            "data":           null,
            "defaultContent": '<div style="width:100%;text-align:center;"><button class="details-control"><i class="fa fa-info" data-toggle="tooltip" data-placement="top" title="More info"></i></button></div>'
        }

    ];

	var global_public_strains = [];

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
		    headers_defs = set_headers_metadata(global_public_strains);

		    console.log(global_public_strains, headers_defs);
			
			if(headers_defs[1].length != 0) strains_headers = headers_defs[1];
			else{
				modalAlert("There are no strains associated with this species. Define a new strain inside a Project.")
			}
			
			objects_utils.restore_table_headers('modify_strains_table', strains_headers, false, function(){
		    	objects_utils.loadDataTables('modify_strains_table', global_public_strains, headers_defs[0], strains_headers);

			    global_public_strains.map(function(d){
			    	strain_name_to_id[d.strainID] = d.id;
			    });
			    $('#waiting_spinner').css({display:'none'});
			    $('#modify_strains_controller_div').css({display:'block'}); 
			    $("#modify_strains_table").DataTable().draw();
			});
		});

	}

	$scope.modifyStrains = function(){
		strain_selected = [];
		
		var strain_selected = $.map($('#modify_strains_table').DataTable().rows('.selected').data(), function(item){
			console.log(item);
	        return item;
	    });
	    console.log(strain_selected);

	    if (strain_selected.length == 0){
	    	modalAlert("Please select a strain first.", function(){

			});
			return;
	    }
	    var strain_id_in_use = strain_selected[0].id;

	    for(key in strain_selected[0]){
	    	$('#'+key).val(strain_selected[0][key]);
	    }
	    $('#modifyStrainModal').modal("show");

	    $('#update_metadata_button').off("click");

	    $('#update_metadata_button').on("click", function(){
	    	updateMetadata(strain_id_in_use);
	    });
	}

	updateMetadata = function(strain_id_in_use){
		single_project.update_metadata(strain_id_in_use, function(response){

			single_project.get_strains(true, function(strains_results){
			    objects_utils.destroyTable('modify_strains_table');
			    global_public_strains = strains_results.public_strains;
			    headers_defs = set_headers_metadata(global_public_strains);
				
				strains_headers = headers_defs[1];
				
				objects_utils.restore_table_headers('modify_strains_table', strains_headers, false, function(){
				    objects_utils.loadDataTables('modify_strains_table', global_public_strains, headers_defs[0], strains_headers);
						modalAlert("Strain metadata was modified.", function(){
					});
				});
			});
		});
	}

});