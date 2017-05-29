innuendoApp.controller("reportsCtrl", function($scope, $rootScope, $http) {

	$('#waiting_spinner').css({display:'block', position:'fixed', top:'40%', left:'55%'}); 

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

	var user_reports = [];
	var user_reports_table_headers = ['Username', 'Run identifier', 'Sample', 'Procedure'];
	var reports_info_table_headers = ['Sample', 'Run Identifier'];
	var reports_metadata_table_headers = metadata.get_minimal_fields();

	var saved_reports_headers = ['Username', 'Name', 'Description'];

	var saved_reports = [];

	var run_infos = [];
	var run_results = [];

	var global_results_dict = {};

	$scope.user_reports_table_headers = user_reports_table_headers;
	$scope.reports_info_table_headers = reports_info_table_headers;
	$scope.reports_metadata_table_headers = reports_metadata_table_headers;
	$scope.saved_reports_headers = saved_reports_headers;

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

    var reports_info_col_defs = [
    	{
            "className":      'select-checkbox',
            "orderable":      false,
            "data":           null,
            "defaultContent": ''
        },
        { "data": "Sample" },
        { "data": "job_id" },
        {
            "className":      'details-control',
            "orderable":      false,
            "data":           null,
            "defaultContent": '<div style="width:100%;text-align:center;"><button class="details-control btn-default"><i class="fa fa-lg fa-info"></i></button></div>'
        }
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

    $("#act_rep").on("click", function(){
    	$("#active_rep_div").css({"display":"block"});
		$("#saved_rep_div").css({"display":"none"});
		$("#user_jobs_div").css({"display":"none"});
		$("#reports_info_table").DataTable().draw();
		$("#reports_results_table").DataTable().draw();
		$("#reports_results_table_wrapper").css({"display": "none"});
		$("#reports_info_table_wrapper").css({"display": "block"});
		$("#act_rep").addClass("active");
		$("#user_jobs").removeClass("active");
		$("#saved_rep").removeClass("active");
	});

	$("#user_jobs").on("click", function(){
		$("#active_rep_div").css({"display":"none"});
		$("#saved_rep_div").css({"display":"none"});
		$("#user_jobs_div").css({"display":"block"});
		$("#reports_table").DataTable().draw();
		$("#user_jobs").addClass("active");
		$("#act_rep").removeClass("active");
		$("#saved_rep").removeClass("active");
	});

	$("#saved_rep").on("click", function(){
		$("#active_rep_div").css({"display":"none"});
		$("#saved_rep_div").css({"display":"block"});
		$("#user_jobs_div").css({"display":"none"});
		$("#saved_reports_table").DataTable().draw();
		$("#saved_rep").addClass("active");
		$("#user_jobs").removeClass("active");
		$("#act_rep").removeClass("active");
	});

	var objects_utils = new Objects_Utils();

	//to be transfered when report is saved
	var current_job_ids = [];
	var current_strain_names = [];
	var info_to_use = [];
	var results_to_use = [];
	var current_strains_data = [];

	setTimeout(function(){ 
		$('#waiting_spinner').css({display:'none'}); 
		$('#reports_controller_div').css({display:'block'});
		$.fn.dataTable.tables( { visible: true, api: true } ).columns.adjust(); 
		console.log(run_infos, reports_info_col_defs, reports_info_table_headers);
		objects_utils.loadDataTables('reports_info_table', run_infos, reports_info_col_defs, reports_info_table_headers);
	}, 3000);

	$('#project_selector').on("change", function(){
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

					if($rootScope.showing_jobs && $rootScope.showing_jobs.length != 0){
						show_results_and_info($rootScope.showing_jobs);
					}
				});
			});
	    }

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


	function process_report_data(identifier, report_data, sample_name, procedure, job, callback){

		var run_information = [];
		var run_results = [];
		var pos = 0;
		var other_pos = 0;

		if(procedure.indexOf('INNUca') > -1){

			var run_info_keys = Object.keys(report_data.run_info[identifier].modules_run_report);

			var aux_info = {};
			aux_info['Sample'] = sample_name;
			for(info_key in run_info_keys){
				aux_info[run_info_keys[info_key]] = report_data.run_info[identifier].modules_run_report[run_info_keys[info_key]][0];
			}
			var run_results_keys = Object.keys(report_data.run_stats[identifier]);

			var aux_results = {};
			aux_results['Sample'] = sample_name;
			for(results_key in run_results_keys){
				aux_results[run_results_keys[results_key]] = report_data.run_stats[identifier][run_results_keys[results_key]];
			}
			console.log([aux_info, aux_results]);
			return callback([aux_info, aux_results], job);
		}
		else if(procedure.indexOf('chewBBACA') > -1){
			var aux_info = {};
			aux_info['Sample'] = sample_name;
			console.log(report_data);
			for(x in report_data.run_stats){
				console.log("AQUI");
				if(x == 'header') continue;
				else{
					for(y in report_data.run_stats[x]){
						console.log("AQUI2");
						aux_info[report_data.run_stats['header'][y]] = report_data.run_stats[x][y];
					}
				}
			}
			var aux_results = {};
			aux_results['Sample'] = sample_name;
			for(x in report_data.run_results){
				console.log("AQUI3");
				if(x == 'header') continue;
				else{
					for(y in report_data.run_results[x]){
						console.log("AQUI4");
						aux_results[report_data.run_results['header'][y]] = report_data.run_results[x][y];
					}
				}
			console.log([aux_info, aux_results]);
			return callback([aux_info, aux_results], job);
			}
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

	    projects_table.get_species_names(function(results){
	    	$scope.species = results.species;
	        CURRENT_SPECIES_NAME = results.CURRENT_SPECIES_NAME;
	        CURRENT_SPECIES_ID = results.CURRENT_SPECIES_ID;
	        
	        $scope.getSavedReports(function(){

		        projects_table.get_projects_from_species(CURRENT_SPECIES_ID, false, function(results){
			    	results.map(function(d){$scope.projects_names.push(d)});

			    	projects_table.get_projects_from_species(CURRENT_SPECIES_ID, true, function(results){
				    	results.map(function(d){$scope.projects_names.push(d)});

				    	objects_utils.destroyTable('reports_table');

					    if(CURRENT_PROJECT_NAME_ID != ""){
							$('#project_selector').find('option').filter("[name='proj_"+CURRENT_PROJECT_NAME_ID+"']").attr("selected", "selected");
							CURRENT_PROJECT_NAME_ID = "";
							$('#div_back_project').css({'display':"block"});
						}

					    var current_project = $('#project_selector').find('option:selected').attr("name").split("_")[1];
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
										show_results_and_info($rootScope.showing_jobs);

										$.map($('#reports_table').DataTable().rows('.selected').data(), function(data){
									      	$rootScope.showing_strain_names.push(data.sample_name);
									    });

									    show_strains_metadata($rootScope.showing_strain_names);
									}

									$('#waiting_spinner').css({display:'none'}); 
									$('#reports_controller_div').css({display:'block'});
									$.fn.dataTable.tables( { visible: true, api: true } ).columns.adjust(); 
									console.log(run_infos, reports_info_col_defs, reports_info_table_headers);
									objects_utils.loadDataTables('reports_info_table', run_infos, reports_info_col_defs, reports_info_table_headers);
								});
							})
					    }
				    });
				});

		    });

	    });

		$('#button_back_project').on("click", function(){
			$('#projects_button').trigger("click");
			projects_table.load_project("", CURRENT_PROJECT_ID, true, function(results){
				CURRENT_PROJECT = results.project;
				$scope.selectedTemplate.path = results.template;
			});
		});
	   
	}

	$scope.change_report_by_specie = function(species_id, species_name){

		$('#reports_container').css({display:"none"});
		$('#waiting_spinner').css({display:'block', position:'fixed', top:'40%', left:'55%'}); 

	    CURRENT_SPECIES_ID = species_id;
	    CURRENT_SPECIES_NAME = species_name;
	    $scope.currentSpecieID = species_id;

	    $scope.projects_names = [];
	    $scope.report_procedures = [];

	    objects_utils.destroyTable('reports_table');
	    objects_utils.destroyTable('saved_reports_table');
	    objects_utils.destroyTable('reports_info_table');
		objects_utils.destroyTable('reports_results_table');
		objects_utils.destroyTable('reports_metadata_table');

	    projects_table.get_projects_from_species(CURRENT_SPECIES_ID, false, function(results){
	    	//console.log(results);
	    	results.map(function(d){$scope.projects_names.push(d)});

	    	$scope.report_procedures = [];
			global_results_dict = {};
			run_infos = [];
			run_results = [];
			current_strains_data = [];
			current_job_ids = [];


	    	projects_table.get_projects_from_species(CURRENT_SPECIES_ID, true, function(results){
		    	//console.log(results);
		    	results.map(function(d){$scope.projects_names.push(d)});

		    	objects_utils.destroyTable('reports_table');
			    try{
			    	var current_project = $('#project_selector').find('option:selected').attr("name").split("_")[1];
			    }
			    catch(e){
			    	var current_project = "";
			    }

			    console.log(current_project);

			    $scope.getSavedReports(function(){

				    if(current_project != ""){
				    	pg_requests.get_applied_pipelines(null, current_project, function(response){
							console.log(response);
							var pipelines_to_check = [];
							for(x in response.data){
								if(response.data[x].parent_pipeline_id != null) pipelines_to_check.push(response.data[x].parent_pipeline_id);
								else pipelines_to_check.push(response.data[x].id);
							}
							pipelines_to_check = pipelines_to_check.join();
					    	reports.get_project_reports(current_project, pipelines_to_check, function(response){
							
								user_reports = response.data;
								if(user_reports.message != undefined) user_reports = [];

								if($rootScope.showing_jobs && $rootScope.showing_jobs.length != 0){
									show_results_and_info($rootScope.showing_jobs);
								}
								$('#waiting_spinner').css({display:'none'}); 
								$('#reports_container').css({display:"block"});
								$.fn.dataTable.tables( { visible: true, api: true } ).columns.adjust(); 
								console.log(run_infos, reports_info_col_defs, reports_info_table_headers);
								objects_utils.loadDataTables('reports_info_table', run_infos, reports_info_col_defs, reports_info_table_headers);
								objects_utils.loadDataTables('reports_metadata_table', current_strains_data, reports_metadata_col_defs, reports_metadata_table_headers);
								objects_utils.loadDataTables('reports_table', user_reports, user_reports_col_defs, user_reports_table_headers);
								$('#reports_metadata_table_wrapper').css({'display':'none'});
								$("#act_rep").trigger("click");
							});
						});
				    }
				    else{
				    	console.log("AQUI");
				    	$('#waiting_spinner').css({display:'none'}); 
						$('#reports_container').css({display:"block"});
						$.fn.dataTable.tables( { visible: true, api: true } ).columns.adjust(); 
						console.log(run_infos, reports_info_col_defs, reports_info_table_headers);
						objects_utils.loadDataTables('reports_info_table', run_infos, reports_info_col_defs, reports_info_table_headers);
						objects_utils.loadDataTables('reports_metadata_table', current_strains_data, reports_metadata_col_defs, reports_metadata_table_headers);
						objects_utils.loadDataTables('reports_table', [], user_reports_col_defs, user_reports_table_headers);
						$('#reports_metadata_table_wrapper').css({'display':'none'});
						$("#act_rep").trigger("click");
						//table = $('#saved_reports_table').DataTable();
						//table.draw();
				    }
				});
		    });
	    });

	};

	$scope.showReport = function(){

		objects_utils.destroyTable('reports_info_table');
	    objects_utils.destroyTable('reports_results_table');

		//current_job_ids = []

		show_results_and_info(null);
		show_strains_metadata(null);

		objects_utils.show_message('s_report_message_div', 'success', 'Report was added to Active Report tab.')
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

	$scope.showReportModal = function(){

		$('#saveReportModal').modal('show');
		
	},

	$scope.showMergedTableModal = function(){

		if($('#reports_info_table_wrapper').css('display') == 'block') var table_id = 'reports_info_table';
		else if($('#reports_results_table_wrapper').css('display') == 'block') var table_id = 'reports_results_table';
		else if($('#reports_metadata_table_wrapper').css('display') == 'block') var table_id = 'reports_metadata_table';
		else return;

		mergeResultsData(table_id, function(results){
			objects_utils.destroyTable('merged_results_table');
		    objects_utils.loadTableFromArrayData('merged_results_table', results[0], results[1]);

			$('#MergedTableModal').modal('show');
			
			setTimeout(function(){
				$('#merged_results_table').DataTable().columns.adjust().draw();
			},200);
		});		
	},

	$scope.saveReport = function(){

		$('#saveReportModal').modal('hide');
		
		reports.save_reports(current_job_ids, current_strain_names, function(response){
			saved_reports.push(response.data[0])
			objects_utils.destroyTable('saved_reports_table');
			objects_utils.loadDataTables('saved_reports_table', saved_reports, user_saved_reports_col_defs, saved_reports_headers);
		});
	},

	$scope.showCombinedReport = function(){
		
		var table = $('#saved_reports_table').DataTable();
    
	    var selected_job_ids = $.map(table.rows('.selected').data(), function(data){
	       return data.run_identifiers.split(',');
	    });

	    var current_names = $.map(table.rows('.selected').data(), function(data){
	       return data.strain_names.split(',');
	    });

	    //console.log(current_names);

	    show_results_and_info(selected_job_ids);
	    show_strains_metadata(current_names);

		objects_utils.show_message('s_report_message_div', 'success', 'The Saved Report was loaded to the Active Report tab.')

	}

	$scope.deleteCombinedReport = function(){
		reports.delete_combined_report(function(response){
			var table = $('#saved_reports_table').DataTable();
			table.row('.selected').remove().draw( false );
		});
	}

	function show_strains_metadata(strain_names){

		if(strain_names==null) to_use = null;
		else to_use = strain_names;
		reports.get_strain_by_name(to_use, function(strain_data){

			$.each(strain_data, function(i, el){
				isthere = false;
				for(i in current_strains_data){
					if (current_strains_data[i].Sample === el.Sample) {
			            isthere=true;
			            break;
			        }
				}
				if(!isthere) current_strains_data.push(el);
			});

			current_strain_names = $.map(current_strains_data, function(data){
				return data.Sample;
			})

			if(current_strains_data.length != 0){
				if ($scope.report_procedures.indexOf("Metadata") < 0){
					$scope.report_procedures.push("Metadata");
				}
				objects_utils.destroyTable('reports_metadata_table');
				objects_utils.loadDataTables('reports_metadata_table', current_strains_data, reports_metadata_col_defs, reports_metadata_table_headers);

				$('#reports_metadata_table_wrapper').css({'display':'none'});
				setTimeout(function(){
					$('#strains_metadata').on('click', function(){
						$('#reports_info_table_wrapper').css({'display':'none'});
						$('#reports_results_table_wrapper').css({'display':'none'});
						$('#reports_metadata_table_wrapper').css({'display':'block'});
					});
				}, 200)
			}

		});
	}

	function show_results_and_info(job_ids){
		
		reports.get_multiple_user_reports(job_ids, function(response){

			console.log(response);

			if(response == null) return;

			var run_identifiers = [];
			var info_headers = [];
			var results_headers = [];

			keys = Object.keys(global_results_dict);

			var identifier = "";

			total_jobs = response.data.length;
			count_jobs = 0;

			for(job in response.data){
				//console.log(response.data[job].report_data);
				if(response.data[job].procedure_name == "INNUca") identifier = Object.keys(response.data[job].report_data.run_info)[0];
				else identifier = "";

				//if(identifier == "stats") response.data[job].report_data.shift();

				//console.log(response.data[job].report_data);

				//identifier = Object.keys(response.data[job].report_data[0])[0];
				
				run_identifiers.push(identifier);

				//if(identifier == "stats") continue:

				if ($.inArray(response.data[job].job_id, current_job_ids) != -1){
					count_jobs += 1;
					continue;
				}

				process_report_data(identifier, response.data[job].report_data, response.data[job].sample_name, response.data[job].procedure_name, job, function(results, job_to_use){
					
					console.log(results);
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

					if(count_jobs == total_jobs) {

						console.log(global_results_dict);
						procedure_to_show = Object.keys(global_results_dict)[0];

						if(procedure_to_show.indexOf('chewBBACA') > -1) $('#phyloviz_button').css({display:"block"});
						else $('#phyloviz_button').css({display:"none"});
						
						run_infos=global_results_dict[procedure_to_show][0];
						run_results=global_results_dict[procedure_to_show][1];

						$scope.run_identifiers = run_identifiers;
						$scope.run_results_headers = results_headers;
						$scope.run_infos_headers = info_headers;

						var q = Object.keys(global_results_dict);
						
						for(p in q){

							$('#run_info_' + q[p]).unbind( "click" );
							$('#results_info_' + q[p]).unbind( "click" );

							$('#run_info_' + q[p]).on('click', function(){

								sp = this.id.split('_');
								to_check = sp.splice(2, sp.length).join('_');

								if(to_check.indexOf('chewBBACA') > -1) $('#phyloviz_button').css({display:"block"});
								else $('#phyloviz_button').css({display:"none"});

								run_infos=global_results_dict[to_check][0];
								run_results=global_results_dict[to_check][1];

								objects_utils.destroyTable('reports_info_table');
								objects_utils.destroyTable('reports_results_table');

								objects_utils.loadDataTables('reports_info_table', run_infos, reports_info_col_defs, reports_info_table_headers);
								objects_utils.loadDataTables('reports_results_table', run_results, reports_info_col_defs, reports_info_table_headers);

								$('#reports_info_table_wrapper').css({'display':'block'});
								$('#reports_results_table_wrapper').css({'display':'none'});
								$('#reports_metadata_table_wrapper').css({'display':'none'});
								//$('#'+table_id).DataTable().draw();
							});

							$('#results_info_' + q[p]).on('click',function(){

								sp = this.id.split('_');
								to_check = to_check = sp.splice(2, sp.length).join('_');

								if(to_check.indexOf('chewBBACA') > -1) $('#phyloviz_button').css({display:"block"});
								else $('#phyloviz_button').css({display:"none"});

								run_infos=global_results_dict[to_check][0];
								run_results=global_results_dict[to_check][1];

								objects_utils.destroyTable('reports_info_table');
								objects_utils.destroyTable('reports_results_table');

								objects_utils.loadDataTables('reports_info_table', run_infos, reports_info_col_defs, reports_info_table_headers);
								objects_utils.loadDataTables('reports_results_table', run_results, reports_info_col_defs, reports_info_table_headers);
								
								$('#reports_info_table_wrapper').css({'display':'none'});
								$('#reports_results_table_wrapper').css({'display':'block'});
								$('#reports_metadata_table_wrapper').css({'display':'none'});
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

						objects_utils.loadDataTables('reports_info_table', run_infos, reports_info_col_defs, reports_info_table_headers);
						objects_utils.loadDataTables('reports_results_table', run_results, reports_info_col_defs, reports_info_table_headers);

						$('#reports_info_table_wrapper').css({'display':'block'});
						$('#reports_results_table_wrapper').css({'display':'none'});
						$('#reports_metadata_table_wrapper').css({'display':'none'});

					}
				});

			}
			
			

		});
		
	}

	$('#phyloviz_button').click(function(){
		$('#sendToPHYLOViZModal').modal('show');
	})


	$scope.sendToPHYLOViZ = function(){

		if($('#reports_results_table_wrapper').css('display') == 'block') var table_id_profile = 'reports_results_table';
		else return;

		var table_id_metadata = 'reports_metadata_table';

		var total_results = [];

		//profile
		mergeResultsData(table_id_profile, function(results_profile){
			total_results.push(results_profile);

			//metadata
			mergeResultsData(table_id_metadata, function(results_metadata){
				total_results.push(results_metadata);
				//Send to phyloviz
				reports.sendToPHYLOViZ(total_results, function(response){
					var to_phyloviz = "";
					if(response.data.indexOf("http") < 0){
						to_phyloviz = "An error as occuried when uploading data to PHYLOViZ Online";
						$('#phyloviz_output').empty();
						$('#phyloviz_output').append(to_phyloviz);
					}
					else{

						to_phyloviz = "<button class='btn btn-md btn-info' id='button_view_phyloviz'>View Tree</button>";
						$('#phyloviz_output').empty();
						$('#phyloviz_output').append(to_phyloviz);
						$("#button_view_phyloviz").on("click", function(){
							window.open('http'+response.data.split('http')[1],'_blank');
						});
					} 
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
		    	for(k in global_results_dict[keys[i]][0]){
		    		if($.inArray(global_results_dict[keys[i]][0][k].Sample, selected_sample_ids) == -1){
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

			objects_utils.loadDataTables('reports_info_table', run_infos, reports_info_col_defs, reports_info_table_headers);
			objects_utils.loadDataTables('reports_results_table', run_results, reports_info_col_defs, reports_info_table_headers);
			objects_utils.loadDataTables('reports_metadata_table', current_strains_data, reports_metadata_col_defs, reports_metadata_table_headers);

			for(j in table_ids){
				if(table_ids[j] != id_to_use) $('#'+table_ids[j]+'_wrapper').css({'display':'none'});
				else $('#'+table_ids[j]+'_wrapper').css({'display':'block'});
			}




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

		objects_utils.loadDataTables('reports_info_table', run_infos, reports_info_col_defs, reports_info_table_headers);
		objects_utils.loadDataTables('reports_results_table', run_results, reports_info_col_defs, reports_info_table_headers);
		objects_utils.loadDataTables('reports_metadata_table', current_strains_data, reports_metadata_col_defs, reports_metadata_table_headers);

		$('#reports_info_table_wrapper').css({'display':'none'});
		$('#reports_results_table_wrapper').css({'display':'none'});
		$('#reports_metadata_table_wrapper').css({'display':'none'});

}


});
