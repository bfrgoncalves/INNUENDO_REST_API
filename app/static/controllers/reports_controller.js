


function set_headers_reports(global_strains, procedure){
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
			if (x != "Analysis" && x != "id" && x != "species_id" && x != "strain_id"){
				if($.inArray(matching_fields[x], minimal_fields) > -1){
					p_col_defs.push({"data":x});
				}
				else p_col_defs.push({"data":x, "visible":true});
				strains_headers.push(matching_fields[x] == undefined ? x:matching_fields[x]);
			}
		}		
	}

    return [p_col_defs, strains_headers]
}

function download_profile(button){

	profile_data = $('#reports_results_table').DataTable().rows($(button).closest("tr")).data()[0];
	var headers = Object.keys(profile_data);

	var real_headers = ["Sample"]
	var body_p = [profile_data.Sample];
	var final_string = ""


	for(x in headers){
		if(headers[x] != "Sample" && headers[x] != "job_id"){
			real_headers.push(headers[x]);
			body_p.push(profile_data[headers[x]]);
		}
	}

	final_string += real_headers.join("\t") + "\n" + body_p.join("\t");

	uriContent = "data:application/octet-stream," + encodeURIComponent(final_string);
	
	var downloadLink = document.createElement("a");
	downloadLink.href = uriContent;
	downloadLink.download = "profile_" + profile_data.Sample + ".tab";

	document.body.appendChild(downloadLink);
	downloadLink.click();
	document.body.removeChild(downloadLink);

	window.open(uriContent, 'profile_' + profile_data.Sample + ".tab");
}


innuendoApp.controller("reportsCtrl", function($scope, $rootScope, $http) {

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

	reports = new Report($http);
	var objects_utils = new Objects_Utils();
	var metadata = new Metadata();

	var projects_table = new Projects_Table(0, null, $http);
	var pg_requests = new Requests(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http);

	$scope.reports_headers = [];
	$scope.run_identifiers = [];
	$scope.run_infos_headers = [];
	$scope.run_results_headers = [];
	$scope.report_procedures = [];
	$scope.saved_reports_headers = [];

	$scope.projects_names = [];
	$scope.currently_showing = "";

	var user_reports = [];
	var user_reports_table_headers = ['Username', 'Run identifier', 'Sample', 'Procedure'];
	var reports_info_table_headers = ['Sample', 'Run Identifier'];
	var reports_results_table_headers = ['Sample', 'Run Identifier'];
	var reports_metadata_table_headers = metadata.get_minimal_fields();

	var saved_reports_headers = ['Username', 'Name', 'Description'];
	var trees_headers = ['Dataset Name', 'Description', 'Timestamp', 'PHYLOViZ User'];

	var saved_reports = [];
	var trees = [];

	var run_infos = [];
	var run_results = [];

	var global_results_dict = {};
	var global_additional_data = {};
	var global_additional_data_strains = [];
	var current_procedure = "";

	$scope.user_reports_table_headers = user_reports_table_headers;
	$scope.trees_headers = trees_headers;
	$scope.reports_info_table_headers = reports_info_table_headers;
	$scope.reports_results_table_headers = reports_results_table_headers;
	$scope.reports_metadata_table_headers = reports_metadata_table_headers;
	$scope.saved_reports_headers = saved_reports_headers;
	$scope.species_in_use = CURRENT_SPECIES_NAME;

	var user_reports_col_defs = [
    	{
            "className":      'select-checkbox',
            "orderable":      false,
            "data":           null,
            "defaultContent": ''
        },
        { "data": "username" },
        { "data": "job_id" },
        { "data": "sample_name" },
        { "data": "procedure_name" }
    ];

    var user_saved_reports_col_defs = [
    	{
            "className":      'select-checkbox',
            "orderable":      false,
            "data":           null,
            "defaultContent": ''
        },
        { "data": "username" },
        { "data": "name" },
        { "data": "description" }
    ];

    var user_trees_col_defs = [
    	{
            "className":      'select-checkbox',
            "orderable":      false,
            "data":           null,
            "defaultContent": ''
        },
        { "data": "name" },
        { "data": "description" },
        { "data": "timestamp" },
		{ "data": "phyloviz_user" }
    ];

    var reports_info_col_defs = [
    	{
            "className":      'select-checkbox',
            "orderable":      false,
            "data":           null,
            "defaultContent": ''
        },
        { "data": "Sample" },
        { "data": "job_id" },
    ];

    var reports_metadata_col_defs = [
    	{
            "className":      'select-checkbox',
            "orderable":      false,
            "data":           null,
            "defaultContent": ''
        },
        { "data": "Sample" },
        { "data": "species_id" },
        { "data": "source_Source" },
        { "data": "Location" },
        { "data": "SampleReceivedDate" },
        { "data": "SamplingDate" },
        {
            "className":      'details-control',
            "orderable":      false,
            "data":           null,
            "defaultContent": '<div style="width:100%;text-align:center;"><button class="details-control btn-default"><i class="fa fa-lg fa-info"></i></button></div>'
        }

    ];

    function modalAlert(text, callback){

    	$('#buttonSub').off("click");
    	$('#buttonCancelAlert').off("click");

    	$('#modalAlert .modal-body').empty();
    	$('#modalAlert .modal-body').append("<p>"+text+"</p>");

    	$('#buttonSub').one("click", function(){
    		$('#modalAlert').modal("hide");
    		setTimeout(function(){return callback()}, 400);
    	})

    	$('#modalAlert').modal("show");

    }

    $("#act_rep").on("click", function(){
    	$("#active_rep_div").css({"display":"block"});
		$("#saved_rep_div").css({"display":"none"});
		$("#user_jobs_div").css({"display":"none"});
		$("#trees_tab_div").css({"display":"none"});
		$("#reports_results_table_wrapper").css({"display": "none"});
		$('#reports_metadata_table_wrapper').css({'display':'none'});
		$("#reports_info_table_wrapper").css({"display": "block"});
		$("#reports_info_table").DataTable().draw();
		$("#reports_results_table").DataTable().draw();
		$("#act_rep").addClass("active");
		$("#user_jobs").removeClass("active");
		$("#saved_rep").removeClass("active");
		$("#tree_tab").removeClass("active");
		$('#reports_info_table').DataTable().columns.adjust().draw();
		$('#reports_results_table').DataTable().columns.adjust().draw();
		$('#reports_metadata_table').DataTable().columns.adjust().draw();
	});

	$("#user_jobs").on("click", function(){
		$("#active_rep_div").css({"display":"none"});
		$("#saved_rep_div").css({"display":"none"});
		$("#user_jobs_div").css({"display":"block"});
		$("#trees_tab_div").css({"display":"none"});
		$("#reports_table").DataTable().draw();
		$("#user_jobs").addClass("active");
		$("#act_rep").removeClass("active");
		$("#saved_rep").removeClass("active");
		$("#tree_tab").removeClass("active");
	});

	$("#saved_rep").on("click", function(){
		$("#active_rep_div").css({"display":"none"});
		$("#saved_rep_div").css({"display":"block"});
		$("#user_jobs_div").css({"display":"none"});
		$("#trees_tab_div").css({"display":"none"});
		$("#saved_reports_table").DataTable().draw();
		$("#saved_rep").addClass("active");
		$("#user_jobs").removeClass("active");
		$("#act_rep").removeClass("active");
		$("#tree_tab").removeClass("active");
	});

	$("#tree_tab").on("click", function(){
		$("#active_rep_div").css({"display":"none"});
		$("#saved_rep_div").css({"display":"none"});
		$("#user_jobs_div").css({"display":"none"});
		$("#trees_tab_div").css({"display":"block"});
		$("#tree_tab").addClass("active");
		$("#user_jobs").removeClass("active");
		$("#act_rep").removeClass("active");
		$("#saved_rep").removeClass("active");
		$("#reports_trees_table").DataTable().draw();
		$scope.getUserTrees(function(){
			$("#reports_trees_table").DataTable().draw();
		});
	});

	$("#project_search_button").on("click", function(){
		$("#div_search_project").css({"display":"block"});
		$("#div_search_strainid").css({"display":"none"});
		$("#project_search_button").addClass("active");
		$("#strainid_search_button").removeClass("active");
	});

	$("#strainid_search_button").on("click", function(){
		$("#div_search_project").css({"display":"none"});
		$("#div_search_strainid").css({"display":"block"});
		$("#strainid_search_button").addClass("active");
		$("#project_search_button").removeClass("active");
	});

	$("#reset_strain").on("click", function(){
		$scope.$apply(function(){
			$scope.selectedTemplate.path = 'static/html_components/overview.html';
		})
	});

	var objects_utils = new Objects_Utils();

	//to be transfered when report is saved
	var current_job_ids = [];
	var current_strain_names = [];
	var info_to_use = [];
	var results_to_use = [];
	var current_strains_data = [];

	$('#project_selector').on("change", function(){

		$('#waiting_spinner').css({display:'block'}); 
		$('#reports_area').css({display:'none'});
		//console.log('AQUI');
		objects_utils.destroyTable('reports_table');
		var current_project = $(this).children(":selected").attr("name").split('_')[1];

		if(current_project != ""){
			pg_requests.get_applied_pipelines(null, current_project, function(response){
				//console.log(response);
				var pipelines_to_check = [];
				for(x in response.data){
					if(response.data[x].parent_pipeline_id != null) pipelines_to_check.push(response.data[x].parent_pipeline_id);
					else pipelines_to_check.push(response.data[x].id);
				}
				pipelines_to_check = pipelines_to_check.join();
		    	reports.get_project_reports(current_project, pipelines_to_check, function(response){
				
					user_reports = response.data;
					if(user_reports.message != undefined) user_reports = [];

					objects_utils.loadDataTables('reports_table', user_reports, user_reports_col_defs, user_reports_table_headers);

					$('#waiting_spinner').css({display:'none'}); 
					$('#reports_area').css({display:'block'});

					$("#reports_table").DataTable().draw();

					if($rootScope.showing_jobs && $rootScope.showing_jobs.length != 0){
						show_results_and_info($rootScope.showing_jobs, function(){

						});
					}
				});
			});
	    }

	});

	$("#search_report_by_strain_button").on("click", function(){
		strain_id_to_search = $("#strain_id_search_report").val();

		$('#waiting_spinner').css({display:'block'}); 
		$('#reports_area').css({display:'none'});

		objects_utils.destroyTable('reports_table');

		reports.get_reports_by_strain(strain_id_to_search, function(response){
				
			user_reports = response.data;
			console.log(response);
			if(user_reports.message != undefined) user_reports = [];

			objects_utils.loadDataTables('reports_table', user_reports, user_reports_col_defs, user_reports_table_headers);

			$('#waiting_spinner').css({display:'none'}); 
			$('#reports_area').css({display:'block'});

			$("#reports_table").DataTable().draw();

			if($rootScope.showing_jobs && $rootScope.showing_jobs.length != 0){
				show_results_and_info($rootScope.showing_jobs, function(){

				});
			}
		});

	});


	function mergeResultsData(table_id, callback){

		table = $('#'+table_id).DataTable();

		var table_data = $.map(table.rows().data(), function(data){
	       return data;
	    });
 
	    var array_of_data = [];
	    var array_of_headers = [];

	    array_of_headers.push({title:"Sample"});

	    //console.log(table_data);
	    first_time=true;

	    for(index in table_data){
	    	keys = Object.keys(table_data[index]);
	    	if(first_time){
	    		keys.map(function(key){ if(key != 'Sample' && key != 'job_id') array_of_headers.push({title:key} )});
	    		first_time=false;
	    	}
	    	var entry_array = [];

	    	entry_array.push(table_data[index]['Sample']);
	    	for(key in keys){
	    		if(keys[key] != 'Sample' && keys[key] != 'job_id'){
	    			entry_array.push(table_data[index][keys[key]]);
	    		}
	    	}
	    	array_of_data.push(entry_array);
	    }

	    callback([array_of_headers, array_of_data]);
	}

	function getmergeResultsJobIDs(table_id, callback){

		table = $('#'+table_id).DataTable();

		var table_data = $.map(table.rows(".selected").data(), function(data){
	       return data;
	    });
 
	    var array_of_jobs = [];

	    for(index in table_data){
	    	array_of_jobs.push(table_data[index].job_id);
	    }

	    callback(array_of_jobs);
	}



	function process_report_data(identifier, report_data, sample_name, procedure, job, callback){

		var run_information = [];
		var run_results = [];
		var pos = 0;
		var other_pos = 0;


		if(procedure.indexOf('INNUca') > -1){

			steps = ['FastQ_Integrity', 'first_Coverage', 'trueCoverage_ReMatCh', 'first_FastQC', 'Trimmomatic', 'second_Coverage', 'second_FastQC', 'Pear', 'SPAdes', 'Pilon', 'Assembly_Mapping', 'MLST']
			var run_info_keys = steps;
			//var run_info_keys = Object.keys(report_data.run_info[identifier].modules_run_report);

			var aux_info = {};
			aux_info['Sample'] = sample_name;
			console.log(report_data.run_info[identifier].modules_run_report);
			for(info_key in run_info_keys){
				//aux_info[run_info_keys[info_key]] = report_data.run_info[identifier].modules_run_report[run_info_keys[info_key]][0];
				info_data = report_data.run_info[identifier].modules_run_report[run_info_keys[info_key]];
				var info_to_add = "";
				var div_to_add = "<div style='width:100%;height:100%;";
				var div_color="";
				
				if(info_data[0] == true) info_to_add += "Run: Yes<br/>";
				else{
					info_to_add += "Run: No<br/>";
					div_color ="'>";
				}

				if(info_data[0] == true && info_data[1] == null){
					info_to_add += "Succeeded: Yes<br/>";
					div_color ="background-color:#a8d2cc;'>";
				}
				else if(info_data[1] == false){
					info_to_add += "Succedeed: False<br/>";
					for (key in info_data[3]){
						info_to_add += key + ":"+info_data[3][key]+"<br/>"
					}
					div_color ="background-color:#ff7c7c;'>";
				}
				else if (info_data[1] == true && info_data[4] != undefined && Object.keys(info_data[4]).length > 0) {
					info_to_add += "Succeeded: Yes. With warning.<br/>";
					for (key in info_data[4]){
						info_to_add += key + ":"+info_data[4][key]+"<br/>"
					}
					div_color ="background-color:#fae0af;'>";
				}
				else if (info_data[1] == true){
					info_to_add += "Succedeed: Yes<br/>";
					div_color ="background-color:#a8d2cc;'>";
				}

				div_to_add +=  div_color + info_to_add + "</div>"
				
				aux_info[run_info_keys[info_key]] = div_to_add;
			}
			var run_results_keys = Object.keys(report_data.run_stats[identifier]);

			var index = run_results_keys.indexOf("final_assembly");
			run_results_keys.splice(index, 1);

			var aux_results = {};
			aux_results['Sample'] = sample_name;
			for(results_key in run_results_keys){
					aux_results[run_results_keys[results_key]] = report_data.run_stats[identifier][run_results_keys[results_key]];
			}

			return callback([aux_info, aux_results], job);
		}
		else if(procedure.indexOf('chewBBACA') > -1){
			var aux_info = {};
			aux_info['Sample'] = sample_name;

			for(x in report_data.run_stats){
				if(x == 'header') continue;
				else{
					for(y in report_data.run_stats[x]){
						aux_info[report_data.run_stats['header'][y]] = report_data.run_stats[x][y];
					}
				}
			}
			var aux_results = {};
			aux_results['Sample'] = sample_name;
			for(x in report_data.run_output){
				if(x == 'header') continue;
				else{
					for(y in report_data.run_output[x]){
						aux_results[report_data.run_output['header'][y]] = report_data.run_output[x][y];
					}
				}
			return callback([aux_info, aux_results], job);
			}
		}

		else if(procedure.indexOf('PathoTyping') > -1 || procedure.indexOf('Pathotyping') > -1){
			var aux_info = {};
			aux_info['Sample'] = sample_name;
			aux_info["Status"] = "Done";
			
			var aux_results = {};
			aux_results['Sample'] = sample_name;
			for(x in report_data.run_output){
				if(x == 'header') continue;
				if(x == 'stats') continue;
				aux_results[x] = report_data.run_output[x]

			//return callback([aux_info, aux_results], job);
			}
			return callback([aux_info, aux_results], job);
		}
	}

	$scope.showReports = function(){

		//$('#reports_info_table thead').css({'visibility':'hidden'});
		//$('#reports_info_table tfoot').css({'visibility':'hidden'});
		$('#reports_results_table thead').css({'visibility':'hidden'});
		$('#reports_results_table tfoot').css({'visibility':'hidden'});
		$('#reports_metadata_table thead').css({'visibility':'hidden'});
		$('#reports_metadata_table tfoot').css({'visibility':'hidden'});


		objects_utils.destroyTable('reports_info_table');
	    objects_utils.destroyTable('reports_results_table');

	    current_job_ids = [];

	    /*projects_table.get_species_names(function(results){
	    	$scope.species = results.species;
	        CURRENT_SPECIES_NAME = results.CURRENT_SPECIES_NAME;
	        CURRENT_SPECIES_ID = results.CURRENT_SPECIES_ID;*/
	        
        $scope.getSavedReports(function(){

        	$scope.getUserTrees(function(){

		        projects_table.get_projects_from_species(CURRENT_SPECIES_ID, false, function(results){
			    	results.map(function(d){$scope.projects_names.push(d)});

			    	projects_table.get_projects_from_species(CURRENT_SPECIES_ID, true, function(results){
				    	results.map(function(d){$scope.projects_names.push(d)});

				    	objects_utils.destroyTable('reports_table');

					    if(CURRENT_PROJECT_NAME_ID != ""){
							$('#project_selector').find('option').filter("[name='proj_"+CURRENT_PROJECT_NAME_ID+"']").attr("selected", "selected");
							CURRENT_PROJECT_NAME_ID = "";
							//$('#div_back_project').css({'display':"block"});
						}

						try{
							var current_project = $('#project_selector').find('option:selected').attr("name").split("_")[1];
						}
						catch(e){
							console.log("no projects");
							current_project = "";
						}
					    //var current_project = $('#project_selector').find('option:selected').attr("name").split("_")[1];
					    //console.log(current_project);

						if(current_project != ""){

							pg_requests.get_applied_pipelines(null, current_project, function(response){
								//console.log(response);
								var pipelines_to_check = [];
								for(x in response.data){
									if(response.data[x].parent_pipeline_id != null) pipelines_to_check.push(response.data[x].parent_pipeline_id);
									else pipelines_to_check.push(response.data[x].id);
								}
								pipelines_to_check = pipelines_to_check.join();

								reports.get_project_reports(current_project, pipelines_to_check, function(response){
							
									user_reports = response.data;
									if(user_reports.message != undefined) user_reports = [];

									//console.log(user_reports);
									objects_utils.loadDataTables('reports_table', user_reports, user_reports_col_defs, user_reports_table_headers);


									if($rootScope.showing_jobs){
										$.map($('#reports_table').DataTable().rows().data(), function(item, index){

											if($rootScope.showing_jobs.indexOf(item.job_id) > -1){
												var row = $('#reports_table').DataTable().row(index).node();
												$(row).addClass("selected");
											}
										});
									}

									if($rootScope.showing_strain_names == undefined) $rootScope.showing_strain_names = []; 
									
									if($rootScope.showing_jobs && $rootScope.showing_jobs.length != 0){
										show_results_and_info($rootScope.showing_jobs, function(){

										});

										$.map($('#reports_table').DataTable().rows('.selected').data(), function(data){
									      	$rootScope.showing_strain_names.push(data.sample_name);
									    });

									    show_strains_metadata($rootScope.showing_strain_names);
									}

									$('#waiting_spinner').css({display:'none'}); 
									$('#reports_controller_div').css({display:'block'});
									$.fn.dataTable.tables( { visible: true, api: true } ).columns.adjust(); 
									//console.log(run_infos, reports_info_col_defs, reports_info_table_headers);
									objects_utils.restore_table_headers('reports_info_table', reports_info_table_headers, false, function(){
										objects_utils.restore_table_headers('reports_results_table', reports_info_table_headers, false, function(){
											objects_utils.loadDataTables('reports_info_table', run_infos, reports_info_col_defs, reports_info_table_headers);
											objects_utils.loadDataTables('reports_results_table', run_infos, reports_info_col_defs, reports_info_table_headers);
											$("#reports_results_table_wrapper").css({"display": "none"});
											$('.selectpicker').selectpicker({});
										});
									});


								});
							})
					    }
					    else{
					    	$('#waiting_spinner').css({display:'none'}); 
							$('#reports_controller_div').css({display:'block'});
							objects_utils.restore_table_headers('reports_info_table', reports_info_table_headers, false, function(){
								objects_utils.restore_table_headers('reports_results_table', reports_info_table_headers, false, function(){
									objects_utils.loadDataTables('reports_info_table', run_infos, reports_info_col_defs, reports_info_table_headers);
									objects_utils.loadDataTables('reports_results_table', run_infos, reports_info_col_defs, reports_info_table_headers);
									$("#reports_results_table_wrapper").css({"display": "none"});
									$('.selectpicker').selectpicker({});
								});
							});
							modalAlert("There are no projects associated with this species. Create a project and run some analyses to be able to visualize their reports.", function(){});
					    }
				    });
				});
			});

	    });

	    //});

		$('#button_back_project').on("click", function(){
			$('#projects_button').trigger("click");
			projects_table.load_project("", CURRENT_PROJECT_ID, true, function(results){
				CURRENT_PROJECT = results.project;
				$scope.selectedTemplate.path = results.template;
			});
		});
	   
	}

	$scope.showReport = function(){

		$('#reports_container').css({display:"none"});
		$('#waiting_spinner').css({display:'block', position:'fixed', top:'40%', left:'50%'});

		/*objects_utils.destroyTable('reports_info_table');
	    objects_utils.destroyTable('reports_results_table');*/

		show_results_and_info(null, function(show_metadata){
			if(show_metadata) show_strains_metadata(null);
		});
	}

	$scope.getSavedReports = function(callback){
		
		reports.get_saved_user_reports(function(response){
			if (!response.data.message){
			saved_reports = response.data;
			}
			else saved_reports = [];
			objects_utils.loadDataTables('saved_reports_table', saved_reports, user_saved_reports_col_defs, saved_reports_headers);
			callback();
		});

	}

	$scope.getUserTrees = function(callback){
		
		reports.get_user_trees(function(response){
		    console.log(response);
			if (!response.data.message){
			trees = response.data;
			}
			else trees = [];
			objects_utils.destroyTable('reports_trees_table');
			objects_utils.loadDataTables('reports_trees_table', trees, user_trees_col_defs, trees_headers);
			callback();
		});

	}

	$scope.showPHYLOViZTree = function(){
		var tree_to_see = $.map($("#reports_trees_table").DataTable().rows(".selected").data(), function(d){
			return d.uri;
		});
		if(tree_to_see.length == 0){
			modalAlert('Please select an entry from the table first.', function(){});
		}
		else window.open(tree_to_see[0],'_blank');
	}

	$scope.deleteTree = function(){
		var tree_to_delete = $.map($("#reports_trees_table").DataTable().rows(".selected").data(), function(d){
			console.log(d);
			//return d.uri;
		});
	}

	$scope.showReportModal = function(){

		$('#saveReportModal').modal('show');
		
	},

	$scope.showMergedTableModal = function(){

		if($('#reports_info_table_wrapper').css('display') == 'block') var table_id = 'reports_info_table';
		else if($('#reports_results_table_wrapper').css('display') == 'block') var table_id = 'reports_results_table';
		else if($('#reports_metadata_table_wrapper').css('display') == 'block') var table_id = 'reports_metadata_table';
		else return;

		if (current_procedure.indexOf("results_info_chewBBACA") > -1){
			modalAlert("chewBBACA results have too many columns to be visualized. To get the profiles, check the \"Profile\" button of each result row.", function(){});
		}
		else{
			mergeResultsData(table_id, function(results){
				objects_utils.destroyTable('merged_results_table');
			    objects_utils.loadTableFromArrayData('merged_results_table', results[0], results[1]);

				$('#MergedTableModal').modal('show');
				
				setTimeout(function(){
					$('#merged_results_table').DataTable().columns.adjust().draw();
				},200);
			});
		}		
	},

	$scope.saveReport = function(){

		$('#saveReportModal').modal('hide');
		
		reports.save_reports(current_job_ids, current_strain_names, function(response){
			console.log(response);
			saved_reports.push(response.data[0])
			objects_utils.destroyTable('saved_reports_table');
			objects_utils.loadDataTables('saved_reports_table', saved_reports, user_saved_reports_col_defs, saved_reports_headers);
		});
	},

	$scope.showCombinedReport = function(){

		$('#reports_container').css({display:"none"});
		$('#waiting_spinner').css({display:'block', position:'fixed', top:'40%', left:'50%'});
		
		var table = $('#saved_reports_table').DataTable();
    
	    var selected_job_ids = $.map(table.rows('.selected').data(), function(data){
	       return data.run_identifiers.split(',');
	    });

	    var current_names = $.map(table.rows('.selected').data(), function(data){
	       return data.strain_names.split(',');
	    });

	    /*objects_utils.destroyTable('reports_info_table');
	    objects_utils.destroyTable('reports_results_table');*/

	    //console.log(current_names);

	    //CHECK IF WORKS - RESET ACTIVE REPORT ON LOAD SAVED REPORT
	    $scope.report_procedures = [];
		run_infos = [];
		run_results = [];
	    global_results_dict = {}
	    current_strains_data = [];
	    current_job_ids = [];

	    show_results_and_info(selected_job_ids, function(show_metadata){
	    	if(show_metadata) show_strains_metadata(current_names);
	    });

	    modalAlert('The Saved Report was loaded to the Active Report tab.', function(){});

	}

	$scope.deleteCombinedReport = function(){
		reports.delete_combined_report(function(response){
			var table = $('#saved_reports_table').DataTable();
			table.row('.selected').remove().draw( false );
		});
	}

	function show_strains_metadata(strain_names){

		
		global_additional_data = {};

		if(strain_names==null) to_use = null;
		else to_use = strain_names;

		reports.get_strain_by_name(to_use, $( "#project_selector option:selected" ).text(), function(strain_data, project_name){

			var newglobal = [];

			for(st in strain_data){
				isThere = false;
				for(gs in global_additional_data_strains){
					if(global_additional_data_strains[gs].Sample == strain_data[st].Sample){
						isThere = true
						break
					}
				}
				if(isThere == false) global_additional_data_strains.push(strain_data[st]);
			}
			//global_additional_data_strains = global_additional_data_strains.join(strain_data);

			$.each(global_additional_data_strains, function(i, el){
				isthere = false;
				for(j in current_strains_data){
					if (current_strains_data[j].Sample === el.Sample) {
			            isthere=true;

			            for(procedure in $scope.report_procedures){
							if($scope.report_procedures[procedure].indexOf("chewBBACA") > -1){
								//console.log(global_results_dict[$scope.report_procedures[procedure]][INFO_OR_RESULTS["chewBBACA"]][i]);
								//console.log(el);
								if(global_additional_data[i] == undefined) global_additional_data[i] = {};
								global_additional_data[i]["Project Name"] = current_strains_data[j].project_name;
								for(a in ANALYSYS_PARAMETERS["chewBBACA"]){
									if(ANALYSYS_PARAMETERS["chewBBACA"][a] == true){
										try{
											current_strains_data[j][a] = global_results_dict[$scope.report_procedures[procedure]][INFO_OR_RESULTS["chewBBACA"]][i][a];
											if(current_strains_data[i][a] == undefined){
												current_strains_data[i][a] = "NA";
												global_results_dict[$scope.report_procedures[procedure]][INFO_OR_RESULTS["chewBBACA"]][i][a] = "NA";
											}
											else current_strains_data[i][a] = current_strains_data[i][a].replace(/\r?\n|\r/g, "");

											global_additional_data[i][a] = global_results_dict[$scope.report_procedures[procedure]][INFO_OR_RESULTS["chewBBACA"]][i][a];
											if(global_additional_data[i][a] == undefined) global_additional_data[i][a] = "NA";
											else global_additional_data[i][a] = global_additional_data[i][a].replace(/\r?\n|\r/g, "");
										}
										catch(err){
											//console.log("No chewbbaca for this strain");
											current_strains_data[i][a] = "NA";
											global_additional_data[i][a] = "NA";
										}
										
									}
								}
							}
							else if($scope.report_procedures[procedure].indexOf("PathoTyping") > -1 || $scope.report_procedures[procedure].indexOf("Pathotyping") > -1){
								//console.log(global_results_dict[$scope.report_procedures[procedure]][INFO_OR_RESULTS["PathoTyping"]][j]);
								//console.log(el);
								if(global_additional_data[i] == undefined) global_additional_data[i] = {};
								global_additional_data[i]["Project Name"] = current_strains_data[j].project_name;
								for(a in ANALYSYS_PARAMETERS["PathoTyping"]){
									if(ANALYSYS_PARAMETERS["PathoTyping"][a] == true){
										try{
											current_strains_data[j][a] = global_results_dict[$scope.report_procedures[procedure]][INFO_OR_RESULTS["PathoTyping"]][i][a];
											if(current_strains_data[i][a] == undefined){
												current_strains_data[i][a] = "NA";
												global_results_dict[$scope.report_procedures[procedure]][INFO_OR_RESULTS["PathoTyping"]][i][a] = "NA";
											}
											else current_strains_data[i][a] = current_strains_data[i][a].replace(/\r?\n|\r/g, "");

											global_additional_data[i][a] = global_results_dict[$scope.report_procedures[procedure]][INFO_OR_RESULTS["PathoTyping"]][i][a];
											if(global_additional_data[i][a] == undefined) global_additional_data[i][a] = "NA";
											else global_additional_data[i][a] = global_additional_data[i][a].replace(/\r?\n|\r/g, "");
	
										}
										catch(err){
											//console.log("No pathotyping for this strain")
											current_strains_data[i][a] = "NA";
											global_additional_data[i][a] = "NA";
										}
										
									}
								}
								
							}
							else if($scope.report_procedures[procedure].indexOf("INNUca") > -1){
								//console.log(global_results_dict[$scope.report_procedures[procedure]][INFO_OR_RESULTS["INNUca"]][j]);
								//console.log(el);
								if(global_additional_data[i] == undefined) global_additional_data[i] = {};
								global_additional_data[i]["Project Name"] = current_strains_data[j].project_name;
								for(a in ANALYSYS_PARAMETERS["INNUca"]){
									if(ANALYSYS_PARAMETERS["INNUca"][a] == true){
										try{
											current_strains_data[j][a] = global_results_dict[$scope.report_procedures[procedure]][INFO_OR_RESULTS["INNUca"]][i][a];
											if(current_strains_data[i][a] == undefined){
												current_strains_data[i][a] = "NA";
												global_results_dict[$scope.report_procedures[procedure]][INFO_OR_RESULTS["INNUca"]][i][a] = "NA";
											}
											else current_strains_data[i][a] = current_strains_data[i][a].replace(/\r?\n|\r/g, "");

											global_additional_data[i][a] = global_results_dict[$scope.report_procedures[procedure]][INFO_OR_RESULTS["INNUca"]][i][a];
											if(global_additional_data[i][a] == undefined) global_additional_data[i][a] = "NA";
											else global_additional_data[i][a] = global_additional_data[i][a].replace(/\r?\n|\r/g, "");
										}
										catch(err){
											//console.log("No innuca for this strain")
											current_strains_data[i][a] = "NA";
											global_additional_data[i][a] = "NA";
										}
									}
								}
								
							}
						}
			            break;
			        }
				}
				if(!isthere){
					for(procedure in $scope.report_procedures){
						if($scope.report_procedures[procedure].indexOf("chewBBACA") > -1){
							//console.log(global_results_dict[$scope.report_procedures[procedure]][INFO_OR_RESULTS["chewBBACA"]][i]);
							//console.log(el);
							if(global_additional_data[i] == undefined) global_additional_data[i] = {};
							global_additional_data[i]["Project Name"] = project_name;
							for(a in ANALYSYS_PARAMETERS["chewBBACA"]){
								if(ANALYSYS_PARAMETERS["chewBBACA"][a] == true){
									try{
										el[a] = global_results_dict[$scope.report_procedures[procedure]][INFO_OR_RESULTS["chewBBACA"]][i][a];
										if(el[a] == undefined){
											el[a] = "NA";
											global_results_dict[$scope.report_procedures[procedure]][INFO_OR_RESULTS["chewBBACA"]][i][a] = "NA";
										} 
										else el[a] = el[a].replace(/\r?\n|\r/g, "");
										
										global_additional_data[i][a] = global_results_dict[$scope.report_procedures[procedure]][INFO_OR_RESULTS["chewBBACA"]][i][a];
	
										if(global_additional_data[i][a] == undefined) global_additional_data[i][a] = "NA";
										else global_additional_data[i][a] = global_additional_data[i][a].replace(/\r?\n|\r/g, "");
									}
									catch(err){
										//console.log("No chewbbaca procedure for this strain");
										el[a] = "NA";
										global_additional_data[i][a] = "NA";
									}
									
								}
							}
						}
						else if($scope.report_procedures[procedure].indexOf("PathoTyping") > -1 || $scope.report_procedures[procedure].indexOf("Pathotyping") > -1){
							//console.log(global_results_dict[$scope.report_procedures[procedure]][INFO_OR_RESULTS["PathoTyping"]][i]);
							//console.log(el);
							if(global_additional_data[i] == undefined) global_additional_data[i] = {};
							global_additional_data[i]["Project Name"] = project_name;
							for(a in ANALYSYS_PARAMETERS["PathoTyping"]){
								if(ANALYSYS_PARAMETERS["PathoTyping"][a] == true){
									try{
										el[a] = global_results_dict[$scope.report_procedures[procedure]][INFO_OR_RESULTS["PathoTyping"]][i][a];
										//console.log(el[a]);
										if(el[a] == undefined){
											el[a] = "NA";
											global_results_dict[$scope.report_procedures[procedure]][INFO_OR_RESULTS["PathoTyping"]][i][a] = "NA";
										}
										else el[a] = el[a].replace(/\r?\n|\r/g, "");

										global_additional_data[i][a] = global_results_dict[$scope.report_procedures[procedure]][INFO_OR_RESULTS["PathoTyping"]][i][a];
										if(global_additional_data[i][a] == undefined) global_additional_data[i][a] = "NA";
										else global_additional_data[i][a] = global_additional_data[i][a].replace(/\r?\n|\r/g, "");
									}
									catch(err){
										//console.log("No pathotyping procedure for this strain");
										el[a] = "NA";
										global_additional_data[i][a] = "NA";
									}
									
								}
							}
							
						}
						else if($scope.report_procedures[procedure].indexOf("INNUca") > -1){
							if(global_additional_data[i] == undefined) global_additional_data[i] = {};
							global_additional_data[i]["Project Name"] = project_name;
							for(a in ANALYSYS_PARAMETERS["INNUca"]){
								if(ANALYSYS_PARAMETERS["INNUca"][a] == true){
									try{
										el[a] = global_results_dict[$scope.report_procedures[procedure]][INFO_OR_RESULTS["INNUca"]][i][a];
										if(el[a] == undefined){
											el[a] = "NA";
											global_results_dict[$scope.report_procedures[procedure]][INFO_OR_RESULTS["INNUca"]][i][a] = "NA";
										}
										else el[a] = el[a].replace(/\r?\n|\r/g, "");

										global_additional_data[i][a] = global_results_dict[$scope.report_procedures[procedure]][INFO_OR_RESULTS["INNUca"]][i][a];
										if(global_additional_data[i][a] == undefined) global_additional_data[i][a] = "NA";
										else global_additional_data[i][a] = global_additional_data[i][a].replace(/\r?\n|\r/g, "");
									}
									catch(err){
										//console.log("No INNUca procedure for this strain");
										el[a] = "NA";
										global_additional_data[i][a] = "NA";
									}
								}
							}
							
						}
					}
					current_strains_data.push(el);
				}
			});

			//console.log(global_additional_data);

			current_strain_names = $.map(current_strains_data, function(data){
				return data.Sample;
			})

			if(current_strains_data.length != 0){
				if ($scope.report_procedures.indexOf("Metadata") < 0){
					$scope.report_procedures.push("Metadata");
				}
				objects_utils.destroyTable('reports_metadata_table');
				$('#reports_metadata_table thead').css({'visibility':'visible'});
				$('#reports_metadata_table tfoot').css({'visibility':'visible'});

				headers_defs = set_headers_reports(current_strains_data, null);
				
				reports_metadata_table_headers = headers_defs[1];
				//console.log(headers_defs, current_strains_data)
				
				objects_utils.restore_table_headers('reports_metadata_table', reports_metadata_table_headers, false, function(){
					objects_utils.loadDataTables('reports_metadata_table', current_strains_data, headers_defs[0], reports_metadata_table_headers);
					$('#reports_metadata_table_wrapper').css({'display':'none'});
					setTimeout(function(){
						$('#strains_metadata').on('click', function(){
							$('#reports_info_table_wrapper').css({'display':'none'});
							$('#reports_results_table_wrapper').css({'display':'none'});
							$('#reports_metadata_table_wrapper').css({'display':'block'});
							$('#reports_metadata_table').DataTable().draw();
							$scope.$apply(function(){
								$scope.currently_showing = "Strains Metadata";
							})
						});
					}, 200)
				});


			}

		});
	}

	function show_results_and_info(job_ids, callback){
		
		reports.get_multiple_user_reports(job_ids, function(response){

			if(response == null){
				modalAlert('Please select a report first.', function(){});
				$('#waiting_spinner').css({display:'none'}); 
				$('#reports_area').css({display:'block'});
				$('#reports_container').css({display:"block"});
				return;
			}
			else{
				objects_utils.destroyTable('reports_info_table');
	    		objects_utils.destroyTable('reports_results_table');
			}

			var run_identifiers = [];
			var info_headers = [];
			var results_headers = [];

			keys = Object.keys(global_results_dict);

			var identifier = "";

			total_jobs = response.data.length;
			count_jobs = 0;
			problematic_jobs = []
			already_added_jobs = 0;

			for(job in response.data){
				if (Object.keys(response.data[job].report_data).length == 0){
					problematic_jobs.push(response.data[job].job_id);
					count_jobs += 1;
					reports_last_steps();
					continue;
				}
				try{
					if(response.data[job].procedure_name.indexOf("INNUca") > -1) identifier = Object.keys(response.data[job].report_data.run_info)[0];
					else identifier = "";
				}
				catch(err){
					problematic_jobs.push(response.data[job].job_id);
					count_jobs += 1;
					reports_last_steps();
					continue;
				}
				
				run_identifiers.push(identifier);

				if ($.inArray(response.data[job].job_id, current_job_ids) != -1){
					already_added_jobs += 1;
					count_jobs += 1;
					reports_last_steps();
					continue;
				}

				process_report_data(identifier, response.data[job].report_data, response.data[job].sample_name, response.data[job].procedure_name, job, function(results, job_to_use){
					
					count_jobs += 1;

					results[0]['job_id'] = response.data[job_to_use].job_id;
					results[1]['job_id'] = response.data[job_to_use].job_id;

					try{
						global_results_dict[response.data[job_to_use].procedure_name.replace(/ /g,"_")][0].push(results[0]);
						global_results_dict[response.data[job_to_use].procedure_name.replace(/ /g,"_")][1].push(results[1]);
					}
					catch(err){
						global_results_dict[response.data[job_to_use].procedure_name.replace(/ /g,"_")] = [];
						global_results_dict[response.data[job_to_use].procedure_name.replace(/ /g,"_")].push([]);
						global_results_dict[response.data[job_to_use].procedure_name.replace(/ /g,"_")].push([]);
						global_results_dict[response.data[job_to_use].procedure_name.replace(/ /g,"_")][0].push(results[0]);
						global_results_dict[response.data[job_to_use].procedure_name.replace(/ /g,"_")][1].push(results[1]);
					}
					info_to_use.push(results[0]);
					results_to_use.push(results[1]);
					current_job_ids.push(response.data[job_to_use].job_id);

					if ($scope.report_procedures.indexOf(response.data[job_to_use].procedure_name.replace(/ /g,"_")) < 0 && response.data[job_to_use].procedure_name != null){
						$scope.report_procedures.push(response.data[job_to_use].procedure_name.replace(/ /g,"_"));
					}

					reports_last_steps();

					
				});

				function reports_last_steps(){

					if(count_jobs == total_jobs && problematic_jobs.length != total_jobs && already_added_jobs != total_jobs) {
						procedure_to_show = Object.keys(global_results_dict)[0];
						run_infos=global_results_dict[procedure_to_show][0];
						run_results=global_results_dict[procedure_to_show][1];

						$scope.run_identifiers = run_identifiers;
						$scope.run_results_headers = results_headers;
						$scope.run_infos_headers = info_headers;

						var q = Object.keys(global_results_dict);

						setTimeout(function(){
							for(p in q){

								$('#run_info_' + q[p]).off( "click" );
								$('#results_info_' + q[p]).off( "click" );


								$('#run_info_' + q[p]).on('click', function(){

									sp = this.id.split('_');
									selected_id = this.id;
									to_check = sp.splice(2, sp.length).join('_');
									current_procedure = 'run_info_'+to_check;

									run_infos=global_results_dict[to_check][0];
									run_results=global_results_dict[to_check][1];

									objects_utils.destroyTable('reports_info_table');
									objects_utils.destroyTable('reports_results_table');

									objects_utils.destroyTable('reports_info_table');
									objects_utils.destroyTable('reports_results_table');

									$('#phyloviz_button').css({display:"none"});

									headers_defs_info = set_headers_reports(run_infos, "run_info_"+to_check);
									headers_defs_results = set_headers_reports(run_results, "results_info_"+to_check);

									$scope.$apply(function(){
										$scope.currently_showing = "Run information " + to_check;
									})

									run_infos=global_results_dict[to_check][0];
									run_results=global_results_dict[to_check][1];


									reports_info_table_headers = headers_defs_info[1];
									reports_results_table_headers = headers_defs_results[1];

									objects_utils.restore_table_headers('reports_info_table', reports_info_table_headers, false, function(){
										objects_utils.restore_table_headers('reports_results_table', reports_results_table_headers, false, function(){
											
											objects_utils.loadDataTables('reports_info_table', run_infos, headers_defs_info[0], reports_info_table_headers);
											objects_utils.loadDataTables('reports_results_table', run_results, headers_defs_results[0], reports_results_table_headers);

											$('#reports_info_table_wrapper').css({'display':'block'});
											$('#reports_results_table_wrapper').css({'display':'none'});
											$('#reports_metadata_table_wrapper').css({'display':'none'});
										});
									});
									

								});

								$('#results_info_' + q[p]).on('click',function(){

									sp = this.id.split('_');
									selected_id = this.id;
									to_check = sp.splice(2, sp.length).join('_');
									current_procedure = 'results_info_'+to_check;

									run_infos=global_results_dict[to_check][0];
									run_results=global_results_dict[to_check][1];

									objects_utils.destroyTable('reports_info_table');
									objects_utils.destroyTable('reports_results_table');

									headers_defs_info = set_headers_reports(run_infos, "run_info_"+to_check);
									headers_defs_results = set_headers_reports(run_results, "results_info_"+to_check);

									$scope.$apply(function(){
										$scope.currently_showing = "Run results " + to_check;
									})

									objects_utils.destroyTable('reports_info_table');
									objects_utils.destroyTable('reports_results_table');

									if(to_check.indexOf('chewBBACA') > -1) $('#phyloviz_button').css({display:"block"});
									else $('#phyloviz_button').css({display:"none"});

									run_infos=global_results_dict[to_check][0];
									run_results=global_results_dict[to_check][1];

									reports_info_table_headers = headers_defs_info[1];
									reports_results_table_headers = headers_defs_results[1];

									objects_utils.restore_table_headers('reports_info_table', reports_info_table_headers, false, function(){
										objects_utils.restore_table_headers('reports_results_table', reports_results_table_headers, false, function(){
											objects_utils.loadDataTables('reports_info_table', run_infos, headers_defs_info[0], reports_info_table_headers);
											objects_utils.loadDataTables('reports_results_table', run_results, headers_defs_results[0], reports_results_table_headers);

											$('#reports_info_table_wrapper').css({'display':'none'});
											$('#reports_results_table_wrapper').css({'display':'block'});
											$('#reports_metadata_table_wrapper').css({'display':'none'});
										});
									});
								});

							}

							if(run_infos.length == 0){
								$('#reports_info_table thead').css({'visibility':'hidden'});
								$('#reports_info_table tfoot').css({'visibility':'hidden'});
								$('#reports_results_table thead').css({'visibility':'hidden'});
								$('#reports_results_table tfoot').css({'visibility':'hidden'});
								$('#reports_metadata_table thead').css({'visibility':'hidden'});
								$('#reports_metadata_table tfoot').css({'visibility':'hidden'});
							}
							else {
								$('#reports_info_table thead').css({'visibility':'visible'});
								$('#reports_info_table tfoot').css({'visibility':'visible'});
								$('#reports_results_table thead').css({'visibility':'visible'});
								$('#reports_results_table tfoot').css({'visibility':'visible'});
								$('#reports_metadata_table thead').css({'visibility':'visible'});
								$('#reports_metadata_table tfoot').css({'visibility':'visible'});
							}

							$('#waiting_spinner').css({display:'none'}); 
							$('#reports_container').css({display:"block"});

							objects_utils.destroyTable('reports_info_table');
							objects_utils.destroyTable('reports_results_table');

							headers_defs_info = set_headers_reports(run_infos, procedure_to_show);
							headers_defs_results = set_headers_reports(run_results, procedure_to_show);
							
							reports_info_table_headers = headers_defs_info[1];
							reports_results_table_headers = headers_defs_results[1];

							modal_alert_message = 'Reports added to the project.';
							if(problematic_jobs.length > 0){
								modal_alert_message += '\nCould not load some projects. There seems to a be a problem with them. Job ids: ';
								p_jobs = ""
								for(pj in problematic_jobs){
									p_jobs += problematic_jobs[pj] + ", ";
								}
								modal_alert_message += p_jobs
								modal_alert_message = modal_alert_message.substr(0, modal_alert_message.length-1);
								modal_alert_message += modal_alert_message + "\n Try do re-do the analysis for the procedures with those job ids."
							}
							modalAlert(modal_alert_message, function(){});
							$('#reports_info_table_wrapper').css({'display':'block'});
							$('#reports_results_table_wrapper').css({'display':'none'});
							$('#reports_metadata_table_wrapper').css({'display':'none'});

							$("#run_info_" + q[p]).trigger("click");

							callback(true);
						
						
						}, 500);
					}
					else if(problematic_jobs.length == total_jobs){

						procedure_to_show = Object.keys(global_results_dict)[0];
						console.log(procedure_to_show);
						run_infos=global_results_dict[procedure_to_show][0];
						run_results=global_results_dict[procedure_to_show][1];
						
						$('#waiting_spinner').css({display:'none'}); 
						$('#reports_container').css({display:"block"});

						modal_alert_message = 'There is a problem with the analysis from this project.';
						if(problematic_jobs.length > 0){
							modal_alert_message += '\nCould not load some projects. There seems to a be a problem with them. Job ids: ';
							p_jobs = ""
							for(pj in problematic_jobs){
								p_jobs += problematic_jobs[pj] + ", ";
							}
							modal_alert_message += p_jobs
							modal_alert_message = modal_alert_message.substr(0, modal_alert_message.length-1);
							modal_alert_message += modal_alert_message + "\n Try do re-do the analysis for the procedures with those job ids."
						}
						modalAlert(modal_alert_message, function(){});

						objects_utils.destroyTable('reports_info_table');
						objects_utils.destroyTable('reports_results_table');

						headers_defs_info = set_headers_reports(run_infos, procedure_to_show);
						headers_defs_results = set_headers_reports(run_results, procedure_to_show);

						current_procedure = procedure_to_show;

						reports_info_table_headers = headers_defs_info[1];
						reports_results_table_headers = headers_defs_results[1];

						objects_utils.restore_table_headers('reports_info_table', reports_info_table_headers, false, function(){
							objects_utils.restore_table_headers('reports_results_table', reports_results_table_headers, false, function(){
								objects_utils.loadDataTables('reports_info_table', run_infos, headers_defs_info[0], reports_info_table_headers);
								objects_utils.loadDataTables('reports_results_table', run_results, headers_defs_results[0], reports_results_table_headers);

								$('#reports_info_table_wrapper').css({'display':'none'});
								$('#reports_results_table_wrapper').css({'display':'block'});
								$('#reports_metadata_table_wrapper').css({'display':'none'});
							});
						});

						callback(false);
					}
					else if(already_added_jobs == total_jobs){
						procedure_to_show = Object.keys(global_results_dict)[0];
						console.log(procedure_to_show);
						run_infos=global_results_dict[procedure_to_show][0];
						run_results=global_results_dict[procedure_to_show][1];

						$('#waiting_spinner').css({display:'none'}); 
						$('#reports_container').css({display:"block"});

						modal_alert_message = 'Reports were already added.';
						modalAlert(modal_alert_message, function(){});

						objects_utils.destroyTable('reports_info_table');
						objects_utils.destroyTable('reports_results_table');

						headers_defs_info = set_headers_reports(run_infos, procedure_to_show);
						headers_defs_results = set_headers_reports(run_results, procedure_to_show);

						current_procedure = procedure_to_show;

						reports_info_table_headers = headers_defs_info[1];
						reports_results_table_headers = headers_defs_results[1];

						objects_utils.restore_table_headers('reports_info_table', reports_info_table_headers, false, function(){
							objects_utils.restore_table_headers('reports_results_table', reports_results_table_headers, false, function(){
								objects_utils.loadDataTables('reports_info_table', run_infos, headers_defs_info[0], reports_info_table_headers);
								objects_utils.loadDataTables('reports_results_table', run_results, headers_defs_results[0], reports_results_table_headers);

								$('#reports_info_table_wrapper').css({'display':'none'});
								$('#reports_results_table_wrapper').css({'display':'block'});
								$('#reports_metadata_table_wrapper').css({'display':'none'});
							});
						});

						callback(false);
					}
				}

			}
			
			

		});
		
	}

	$('#phyloviz_button').click(function(){

		if($("#reports_results_table").DataTable().rows(".selected").data().length < 1){
			modalAlert("Please select at least one strain for comparison.", function(){});
		}
		else{
			projects_table.get_species_names(function(results){
				options=""
		        results.species.map(function(d){
		        	options += "<option>"+d.name+"</option>";
		        	//return d.name;
		        });

		        $("#species_database").empty();
		        $("#species_database").append(options);
		        $(".selectpicker").selectpicker({});
		        $(".selectpicker").selectpicker("refresh");

		        $('#sendToPHYLOViZModal').modal('show');

		        setTimeout(function(){
		        	$('#missing_data_checkbox').off("click");
		        	$('#missing_data_checkbox').on("click", function(){
						console.log("entrou");
						if($("#missing_data_checkbox").is(":checked")){
							console.log("checked");
							$('#missing_data_character_div').css({"display":"block"});

						}
						else $('#missing_data_character_div').css({"display":"none"});
					});
		        }, 500);

			});
		}
	})


	$scope.sendToPHYLOViZ = function(){

		if($('#reports_results_table_wrapper').css('display') == 'block') var table_id_profile = 'reports_results_table';
		else return;

		var table_id_metadata = 'reports_metadata_table';

		getmergeResultsJobIDs(table_id_profile, function(job_ids){

			reports.sendToPHYLOViZ(job_ids, global_additional_data, CURRENT_SPECIES_ID, function(response){

				modalAlert("Your request was sent to PHYLOViZ Online server. You will be notified when the tree is ready to be visualized. All available trees can be found on the Trees tab at the Reports menu.", function(){

				});
			});

		});
	}

	$scope.deleteFromReports = function(){

		var table_ids = ['reports_info_table', 'reports_results_table', 'reports_metadata_table'];
		var id_to_use = "";

		for(x in table_ids){
			var table = $('#' + table_ids[x]).DataTable();

			if(table.rows('.selected').data().length != 0){
				id_to_use = table_ids[x];
				break;
			}
		}

		if(id_to_use != ""){
			var table = $('#' + id_to_use).DataTable();
		 	var selected_sample_ids = $.map(table.rows('.selected').data(), function(data){
		       return data.Sample;
		    });

		    var selected_job_ids = $.map(table.rows('.selected').data(), function(data){
		       return data.job_id;
		    });

		    keys = Object.keys(global_results_dict);

		    var inter_info = [];
		    var inter_results = [];
		    var inter_meta = [];

		    for(i in keys){
		    	//console.log(current_procedure, keys[i]);
		    	if(current_procedure.indexOf(keys[i]) > -1){
		    		for(k in global_results_dict[keys[i]][0]){
			    		if($.inArray(global_results_dict[keys[i]][0][k].Sample, selected_sample_ids) == -1){
			    			//console.log(global_results_dict[keys[i]][0][k].Sample, selected_sample_ids, run_infos[k])
			    			inter_info.push(run_infos[k]);
			    		}
				    }
				    global_results_dict[keys[i]][0] = inter_info;

				    for(k in global_results_dict[keys[i]][1]){
			    		if($.inArray(global_results_dict[keys[i]][1][k].Sample, selected_sample_ids) == -1){
			    			inter_results.push(run_results[k]);
			    		}
				    }
				    global_results_dict[keys[i]][1] = inter_results;
		    	}
		    }

		    var inter_info = [];
		    var inter_results = [];

		    for(k in run_infos){
		    	//console.log($.inArray(run_infos[k].Sample, selected_sample_ids));
	    		if($.inArray(run_infos[k].Sample, selected_sample_ids) == -1){
	    			inter_info.push(run_infos[k]);
	    		}
		    }
		    run_infos = inter_info;

		    for(k in run_results){
	    		if($.inArray(run_results[k].Sample, selected_sample_ids) == -1){
	    			inter_results.push(run_results[k]);
	    		}
		    }
		    run_results = inter_results;

		    for(k in current_strains_data){
	    		if($.inArray(current_strains_data[k].Sample, selected_sample_ids) == -1){
	    			inter_meta.push(current_strains_data[k]);
	    		}
		    }

		    current_strains_data = inter_meta;
		    
		    var inter_jobs = [];

		    $.map(current_job_ids, function(d){
		    	if($.inArray(d, selected_job_ids) == -1) inter_jobs.push(d);
		    });
			
			current_job_ids = inter_jobs;

			objects_utils.destroyTable('reports_info_table');
			objects_utils.destroyTable('reports_results_table');
			objects_utils.destroyTable('reports_metadata_table');

			headers_defs_info = set_headers_reports(run_infos, current_procedure);
			headers_defs_results = set_headers_reports(run_results, current_procedure);
			headers_defs_metadata = set_headers_reports(current_strains_data, null);

			reports_info_table_headers = headers_defs_info[1];
			reports_results_table_headers = headers_defs_results[1];
			reports_metadata_table_headers = headers_defs_metadata[1];

			//console.log(headers_defs_info, headers_defs_results, headers_defs_metadata)

			objects_utils.restore_table_headers('reports_info_table', reports_info_table_headers, false, function(){
				objects_utils.restore_table_headers('reports_results_table', reports_results_table_headers, false, function(){
					objects_utils.restore_table_headers('reports_metadata_table', reports_metadata_table_headers, false, function(){
						objects_utils.loadDataTables('reports_info_table', run_infos, headers_defs_info[0], reports_info_table_headers);
						objects_utils.loadDataTables('reports_results_table', run_results, headers_defs_results[0], reports_results_table_headers);
						objects_utils.loadDataTables('reports_metadata_table', current_strains_data, headers_defs_metadata[0], reports_metadata_table_headers);

						for(j in table_ids){
							if(table_ids[j] != id_to_use) $('#'+table_ids[j]+'_wrapper').css({'display':'none'});
							else $('#'+table_ids[j]+'_wrapper').css({'display':'block'});
						}
					});
				});
			});

		}
		else return;
	}

	$scope.deleteAllReports = function(){

		$scope.report_procedures = [];

		run_infos = [];
		run_results = [];
		current_strains_data = [];
		current_job_ids = [];

		global_results_dict = {};

		objects_utils.destroyTable('reports_info_table');
		objects_utils.destroyTable('reports_results_table');
		objects_utils.destroyTable('reports_metadata_table');

		headers_defs_info = set_headers_reports(run_infos, null);
		headers_defs_results = set_headers_reports(run_results, null);
		headers_defs_metadata = set_headers_reports(current_strains_data, null);

		reports_info_table_headers = headers_defs_info[1];
		reports_results_table_headers = headers_defs_results[1];
		reports_metadata_table_headers = headers_defs_metadata[1];

		objects_utils.restore_table_headers('reports_info_table', reports_info_table_headers, false, function(){
			objects_utils.restore_table_headers('reports_results_table', reports_results_table_headers, false, function(){
				objects_utils.restore_table_headers('reports_metadata_table', reports_metadata_table_headers, false, function(){
					objects_utils.loadDataTables('reports_info_table', run_infos, headers_defs_info[0], reports_info_table_headers);
					objects_utils.loadDataTables('reports_results_table', run_results, headers_defs_results[0], reports_results_table_headers);
					objects_utils.loadDataTables('reports_metadata_table', current_strains_data, headers_defs_metadata[0], reports_metadata_table_headers);

					$('#reports_info_table_wrapper').css({'display':'none'});
					$('#reports_results_table_wrapper').css({'display':'none'});
					$('#reports_metadata_table_wrapper').css({'display':'none'});

				});
			});
		});
}


});


