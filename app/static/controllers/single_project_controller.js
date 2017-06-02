var get_sp;
var sh;
var pcol;

innuendoApp.controller("projectCtrl", function($scope, $rootScope, $http) {

	$('#waiting_spinner').css({display:'block', position:'fixed', top:'40%', left:'50%'}); 

	$scope.project = {};
	$scope.pipelines, $scope.fileType = [];
    $scope.specie_name, $scope.species_id = "";
    $scope.current_user_name = CURRENT_USER_NAME;

    single_project = new Single_Project(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http, $rootScope);

    $scope.getAppliedPipelines = single_project.get_applied_pipelines;
	$scope.createPipeline = single_project.create_pipeline;
	$scope.getIdsFromProjects = single_project.get_ids_from_processes;
	//$scope.savePipelines = single_project.save_pipelines;

	var objects_utils = new Objects_Utils();

	var metadata = new Metadata();

	metadata.add_owner(CURRENT_USER_NAME);

	$scope.metadata_fields = metadata.get_fields();

	var strains_headers = metadata.get_minimal_fields();

	$scope.strains_headers = strains_headers;

	sh = strains_headers;

	var project_col_defs = [
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
            "defaultContent": '<div><button class="details-control btn-default"><i class="fa fa-lg fa-info" data-toggle="tooltip" data-placement="top" title="More information"></i></button><button class="analysis-control btn-warning"><i class="fa fa-lg fa-tasks" data-toggle="tooltip" data-placement="top" title="Analytical procedures"></i></button></div>'
        	//<button class="lab-protocols-control btn-info"><i class="fa fa-lg fa-flask" data-toggle="tooltip" data-placement="top" title="Lab protocols"></i></button>
        }

    ];

    pcol = project_col_defs;

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

	var global_strains = [];
	var global_public_strains = [];

	$("#description_tab").on("click", function(){
		$("#div_description").css({"display":"block"});
		$("#div_project").css({"display":"none"});
		$("#description_tab").addClass("active");
		$("#project_tab").removeClass("active");
	});

	$("#project_tab").on("click", function(){
		$("#div_description").css({"display":"none"});
		$("#div_project").css({"display":"block"});
		$("#project_tab").addClass("active");
		$("#description_tab").removeClass("active");
	});

	$("#an_proc").on("click", function(){
		$("#procedures_div").css({"display":"block"});
		$("#protocols_div").css({"display":"none"});
		$("#an_proc").addClass("active");
		$("#lab_prot").removeClass("active");
	});

	$("#lab_prot").on("click", function(){
		$("#procedures_div").css({"display":"none"});
		$("#protocols_div").css({"display":"block"});
		$("#lab_prot").addClass("active");
		$("#an_proc").removeClass("active");
	});


	$scope.rep_string = function(st){ return st.replace(/[A-Z]/g, function(x){ return " " + x; }); }


	$scope.showProject = function(){
	    setTimeout(function(){
			single_project.get_user_files(function(response){
        		var t_use = "";
        		for(r in response.data.files){
        			t_use += '<option>' + response.data.files[r] + '</option>';
        		}
        		$('#File_1').append(t_use);
        		$('#File_2').append(t_use);

        		$('.selectpicker').selectpicker({
				});
        	});

        	console.log("##########", CURRENT_JOB_MINE);

        	if(CURRENT_JOB_MINE == false){
        		$("#group_buttons_strain").css({display:"none"});
        		$("#buttons_procedures").css({display:"none"});
        		$("#protocols_div").css({display:"none"});
        		$("#procedures_div").css({display:"none"});
        	}
        	else{
        		$("#group_buttons_strain").css({display:"block"});
        		$("#buttons_procedures").css({display:"block"});
        		$("#procedures_div").css({display:"block"});
        	}

            $scope.getWorkflows(function(){
            	$scope.getStrains(function(){
            		$scope.getProjectStrains(function(){

            			console.log("get applied");

            			$scope.getAppliedPipelines(null, function(strains_results){
		                	objects_utils.destroyTable('strains_table');

		                	if(strains_results.strains == "no_pipelines"){
		                		objects_utils.loadDataTables('strains_table', global_strains, project_col_defs, strains_headers);
			                	$('#waiting_spinner').css({display:'none'}); 
								$('#single_project_controller_div').css({display:'block'}); 
								$.fn.dataTable.tables( { visible: true, api: true } ).columns.adjust();
		                	}
		                	else{

		                		global_strains = strains_results.strains;

			                	objects_utils.loadDataTables('strains_table', global_strains, project_col_defs, strains_headers);
			                	$scope.getIdsFromProjects(function(strains_results){
			                		objects_utils.destroyTable('strains_table');
				                	global_strains = strains_results.strains;
				                	console.log(global_strains);
				                	objects_utils.loadDataTables('strains_table', global_strains, project_col_defs, strains_headers);
				                	$('#waiting_spinner').css({display:'none'}); 
									$('#single_project_controller_div').css({display:'block'}); 
									$.fn.dataTable.tables( { visible: true, api: true } ).columns.adjust();
			                	});

		                	}
		                });

		                $('#fromfileSubmit').on('click', function(e){
							var input_element = document.getElementById('fromfile_file');
						    single_project.load_strains_from_file(input_element, '\t', function(results){
						    });
						  });

		                $('#fromfile_file').on("change", function(){
							$("#file_text").val(this.files[0].name);
						})

						$('#add_pip_from_fileSubmit').on("click", function(){

							console.log("clicked");
							strains_without_pip = single_project.get_no_pip_strains();

							keys_no_pip = Object.keys(strains_without_pip);
							counter = 0;
							if(keys_no_pip.length != 0){
								for(z in strains_without_pip){
									single_project.add_strain_to_project(strains_without_pip[z][1], function(strains_results, strain_name){
											counter += 1;
											$('#file_col_'+strain_name.replace(/ /g,"_")).empty();
											$('#file_col_'+strain_name.replace(/ /g,"_")).append('<p>New Pipeline applied!</p><p><i class="fa fa-check fa-4x" aria-hidden="true"></i></p>');
											
											if(counter == keys_no_pip.length){
												objects_utils.destroyTable('strains_table');
							                	global_strains = strains_results.strains;
							                	console.log(global_strains);
							                	objects_utils.loadDataTables('strains_table', global_strains, project_col_defs, strains_headers);
											}
							        });
								}
							}
						})

            		});
            	});
            });
            
            $scope.specie_name = CURRENT_SPECIES_NAME;
            $scope.species_id = CURRENT_SPECIES_ID;

	    }, 100);
	}

	$scope.getWorkflows = function(callback){

		$scope.project = CURRENT_PROJECT;
		
		CURRENT_PROJECT_NAME_ID = CURRENT_PROJECT_ID;
		
		single_project.get_workflows("Procedure", function(pipelines){
			$scope.pipelines = pipelines;
			console.log("workflows");

			single_project.get_workflows("Classifier", function(pipelines){
				$scope.pipelines_classifiers = pipelines;
				console.log("workflows2");
				callback();
			});
		});

	}

	$scope.applyWorkflow = function(type_protocol){


		single_project.apply_workflow('new', type_protocol, function(strain_results){
			for(i in strain_results.selected_indexes){
				global_strains[i] = strain_results.strains[i];
			}
			objects_utils.destroyTable('strains_table');
			objects_utils.loadDataTables('strains_table', global_strains, project_col_defs, strains_headers);
			console.log('APPly');
		});
	}

	$scope.runPipelines = function(){
		single_project.save_pipelines(function(run){
			console.log('Save');
			if(run == true) single_project.run_pipelines();
			else objects_utils.show_message('project_message_div', 'warning', 'All processes for that strain have been run.');
			console.log('Run');
		});
	}


	function get_strain_pipeline(strain_ids, callback){
		//console.log(strain_ids);
		single_project.get_public_strain_applied_pipelines(strain_ids, function(applied_workflows, strain_ids, pipelines_ids, strains_dict){
			console.log(applied_workflows, strain_ids, pipelines_ids, strains_dict);


			$scope.available_strain_pipelines = applied_workflows;
			$scope.available_pipelines_ids = pipelines_ids;

			console.log(applied_workflows);
			console.log(pipelines_ids);
			
			$('#choosePipelineModal').modal('show');
			
			$("#new_pipeline_button").off('click');
			
			$(".new_pipeline_button").on('click', function(){
				console.log(strain_id, this.strain_id);
				/*add_strain([strain_id], function(){

				});*/
			});

			setTimeout(function(){
				$('.list-group-item').on('click', function(){
					$(".pipeline_strain_button").css({display:"none"});
					$('.list-group-item').removeClass("active");
					$(this).addClass("active");
					$(this).find(".pipeline_strain_button").css({display:"block"});

					$(".pipeline_strain_button").off('click');
			
					$(".pipeline_strain_button").on('click', function(){
						var p_id = $(this).attr("pipeline");
						console.log(p_id);
						var owner_p = $(this).attr("ownerproject");
						console.log(owner_p);
						var strain_id = strains_dict[$(this).attr("strain_id")];
						console.log(strain_id);
						add_strain([strain_id], function(results){
							console.log(results);
							if(results.message != undefined) return callback({message:results.message});
							else{
								single_project.get_and_apply_pipeline(1, p_id, strain_id, owner_p, function(response){
									$scope.getIdsFromProjects(function(strains_results){
				                		objects_utils.destroyTable('strains_table');
					                	global_strains = strains_results.strains;
					                	objects_utils.loadDataTables('strains_table', global_strains, project_col_defs, strains_headers);
					                	callback({strain_id:strain_id});
				                	});
								})
							}
						});
					});
				});
			}, 200);

			//callback();
		})
	}

	get_sp = get_strain_pipeline;

	function add_strain(strain_ids, callback){
		single_project.add_database_strains(strain_ids, function(strains_results){
			console.log(strains_results);
			if(strains_results.message != undefined) return callback(strains_results);
			objects_utils.destroyTable('strains_table');
			global_strains = strains_results.strains;
			objects_utils.loadDataTables('strains_table', global_strains, project_col_defs, strains_headers);
			callback(strains_results);
		});
	}

	$scope.add_Database_Strains = function(){

		var strainids = $.map($('#public_strains_table').DataTable().rows('.selected').data(), function(item){
		        return item['strainID'];
		});

		//console.log(strainids);
		get_strain_pipeline(strainids, function(){
			/*add_strain(function(){
				//objects_utils.loadDataTables('strains_table', $scope.strains);
			});*/
		})
	}

	$scope.add_New_Strain = function(){
		single_project.add_new_strain(function(strains_results){
			if(strains_results.already_there) return;
			objects_utils.destroyTable('strains_table');
			global_strains = strains_results.strains;
			objects_utils.loadDataTables('strains_table', global_strains, project_col_defs, strains_headers);
		});
	}

	$scope.getStrains = function(callback){

		single_project.get_strains(function(strains_results){
		    objects_utils.destroyTable('strains_table');
		    global_public_strains = strains_results.public_strains;
		    objects_utils.loadDataTables('public_strains_table', global_public_strains, public_project_col_defs, strains_headers);
		    //single_project.get_public_strains_applied_pipelines(function(){});
		    console.log("strains");
		    callback();
		});

	}

	$scope.getProjectStrains = function(callback){

		single_project.get_project_strains(function(strains_results){
			global_strains = strains_results.strains;
			//console.log(global_strains);
			objects_utils.loadDataTables('strains_table', global_strains, project_col_defs, strains_headers);
			console.log("projectstrains");
			callback();
		});
	}

	$scope.addStrainToProject = function(strain_name){

		single_project.add_strain_to_project(strain_name, function(strains_results){
			objects_utils.destroyTable('strains_table');
			global_strains = strains_results.strains;
			objects_utils.loadDataTables('strains_table', global_strains, project_col_defs, strains_headers);
		});

	}

	$scope.removeStrainsFromProject = function(){

		single_project.remove_strains_from_project(global_strains, function(strains_results){
			objects_utils.destroyTable('strains_table');
			global_strains = strains_results.strains;
			objects_utils.loadDataTables('strains_table', global_strains, project_col_defs, strains_headers);
		});
	}

});

showCombinedReports = function(li){
	console.log('AQUI');
	single_project.show_combined_reports(li.className);
}

getProcessesOutputs = function(li){
	single_project.get_processes_outputs(li.className, function(response){
		console.log(response);
		single_project.download_result(response, function(response){
		})
	});
}

getProcessesLog = function(li){
	single_project.get_processes_outputs(li.className, function(response){
		console.log(response);
		single_project.download_log(response, function(response){
		})
	});
}

removeAnalysis = function(li){
		single_project.remove_analysis(li, function(){
		});
	}

checkPipelineFromFile = function(element){
	get_sp([$(element).attr("strain_name")], function(results){

		$('#choosePipelineModal').modal('hide');
		$('#file_col_'+$(element).attr("strain_name").replace(/ /g,"_")).empty();

		if(results.message != undefined) $('#file_col_'+$(element).attr("strain_name").replace(/ /g,"_")).append('<p>'+results.message+'</p><p><i class="fa fa-close fa-4x" aria-hidden="true"></i></p>');
		else $('#file_col_'+$(element).attr("strain_name").replace(/ /g,"_")).append('<p>Pipeline applied!</p><p><i class="fa fa-check fa-4x" aria-hidden="true"></i></p>');

	});
}

newPipelineFromFile = function(element){
	console.log($(element).attr("strain_name"));
	var objects_utils = new Objects_Utils();
	single_project.add_strain_to_project($(element).attr("strain_name"), function(strains_results, strain_name){
		objects_utils.destroyTable('strains_table');
		global_strains = strains_results.strains;
		objects_utils.loadDataTables('strains_table', global_strains, pcol, sh);
		$('#file_col_'+strain_name.replace(/ /g,"_")).empty();
		$('#file_col_'+strain_name.replace(/ /g,"_")).append('<p>New Pipeline applied!</p><p><i class="fa fa-check fa-4x" aria-hidden="true"></i></p>');
	});
}