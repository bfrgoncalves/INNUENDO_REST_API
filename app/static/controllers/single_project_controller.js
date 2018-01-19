
/*
Defines more global variables
*/
var get_sp;
var sh;
var pcol;
var global_strains, project_col_defs;
/*
*
*/


/*
Project Controller - A controller that controls all the actions from a Single Project instance
	- showProject
	- getWorkflows
	- applyWorkfow
	- runPipelines
	- get_strain_pipeline
	- add_strain
	- add_Database_Strains
	- add_New_Strain
	- getStrains
	- getProjectStrains
	- addStrainToProject
	- removeStrainsFromProject
	- showCombinedReports
	- getProcessesOutputs
	- getProcessesLog
	- removeAnalysis
	- checkPipelineFromFile
	- newPipelineFromFile

Uses:
	- Object_Utils object
	- Metadata object
	- Single_Project object
*/


function set_headers_single_project(table_id, global_strains){
	var metadata = new Metadata();
	matching_fields = metadata.get_dict_fields_reverse();
	minimal_fields = metadata.get_default_headers();
	headers_order = metadata.get_minimal_fields();
	dict_fields = metadata.get_dict_fields()
	var strains_headers = [];

	if(global_strains.length == 0){

		if (table_id === 'public_strains_table'){
			var p_col_defs = [
		    	{
		            "className":      'select-checkbox',
		            "orderable":      false,
		            "data":           null,
		            "defaultContent": ''
		        },
		        { 
		        	"data": "strainID",
		        	"className": 'strain_cell',

		        },
		        { "data": "SampleReceivedDate" },
		        { "data": "source_Source" },
		        { "data": "AdditionalInformation", "visible":false },
		        { "data": "File_1", "visible":false },
		        { "data": "Primary" , "visible":false},
		        { "data": "SamplingDate" },
		        { "data": "Owner", "visible":false },
		        { "data": "Food-Bug", "visible":false },
		        { "data": "Submitter", "className": 'submitter_cell', "visible":false },
		        { "data": "File_2", "visible":false },
		        { "data": "Location" }

		    ];
		}
		else {

			var p_col_defs = [
		    	{
		            "className":      'select-checkbox',
		            "orderable":      false,
		            "data":           null,
		            "defaultContent": ''
		        },
		        { 
		        	"data": "strainID",
		        	"className": 'strain_cell',

		        },
		        { "data": "SampleReceivedDate" },
		        { "data": "source_Source" },
		        { "data": "AdditionalInformation", "visible":false },
		        { "data": "File_1", "visible":false },
		        { "data": "Primary" , "visible":false},
		        { "data": "SamplingDate" },
		        { "data": "Owner", "visible":false },
		        { "data": "Food-Bug", "visible":false },
		        { "data": "Submitter", "className": 'submitter_cell', "visible":false },
		        { "data": "File_2", "visible":false },
		        { "data": "Location" },
		        {
		            "className":      'details-control',
		            "orderable":      false,
		            "data":           null,
		            "defaultContent": '<div><button class="details-control btn-default"><i class="fa fa-lg fa-info" data-toggle="tooltip" data-placement="top" title="More information"></i></button><button class="analysis-control btn-warning"><i class="fa fa-lg fa-tasks" data-toggle="tooltip" data-placement="top" title="Analytical procedures"></i></button></div>'
		        }

		    ];
		}
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

		for(p in headers_order){
			for(x in global_strains[0]){
				if(x == dict_fields[headers_order[p]]){
					if (x != "Analysis" && x != "id" && x != "species_id" && x != "lab_protocols" && x != "FilesLocation"){
						if($.inArray(matching_fields[x], minimal_fields) > -1){
							if(x === "strainID") {
								p_col_defs.push({"data":x, "className": 'strain_cell'});
							}
							else p_col_defs.push({"data":x});
						}
						else{
							if(x === "Submitter"){
								p_col_defs.push({"data":x, "className": 'submitter_cell', "visible":false});
							}
							else{
								p_col_defs.push({"data":x, "visible":false});
							}
						}
						strains_headers.push(matching_fields[x]);
					}
				}
			}
		}

		if (table_id !== 'public_strains_table'){

			var info_button = "";
			if(SHOW_PROTOCOLS) {
				info_button = "<button class="info-control btn-default"><i class="fa fa-lg fa-info" data-toggle="tooltip" data-placement="top" title="More information"></i></button>";
			}

			var analysis_cell = {
	            "className":      'details-control',
	            "orderable":      false,
	            "data":           null,
	            "defaultContent": '<div>'+info_button+'<button class="analysis-control btn-warning"><i class="fa fa-lg fa-tasks" data-toggle="tooltip" data-placement="top" title="Analytical procedures"></i></button></div>'
	        };

	        p_col_defs.push(analysis_cell);
		}
		
	}

    return [p_col_defs, strains_headers]
}


//Initialize the Single Project Controller and enclosure all its functions
innuendoApp.controller("projectCtrl", function($scope, $rootScope, $http, $timeout) {

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

	$scope.project = {};
	$scope.pipelines, $scope.fileType = [];
    $scope.specie_name, $scope.species_id = "";
    $scope.current_user_name = CURRENT_USER_NAME;

    single_project = new Single_Project(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http, $rootScope);

    $scope.getAppliedPipelines = single_project.get_applied_pipelines;
	$scope.createPipeline = single_project.create_pipeline;
	$scope.getIdsFromProjects = single_project.get_ids_from_processes;

	var objects_utils = new Objects_Utils();

	var metadata = new Metadata();

	metadata.add_owner(CURRENT_USER_NAME);

	$scope.metadata_fields = metadata.get_fields();

	var strains_headers = metadata.get_minimal_fields();

	$scope.strains_headers = strains_headers;

	sh = strains_headers;

	//Used to check if the strain added come from file or app form.
	var trigger_from_file_load = false,

	project_col_defs = [
    	{
            "className":      'select-checkbox',
            "orderable":      false,
            "data":           null,
            "defaultContent": ''
        },
        { 
        	"data": "strainID",
        	"className": 'strain_cell',
        },
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
        { 
        	"data": "strainID",
        	"className": 'strain_cell',
         },
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

	global_strains = [];
	var global_public_strains = [];


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

    /*
    jQuery buttons click region
    */

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

	$("#reset_strain").on("click", function(){
		$scope.$apply(function(){
			$scope.selectedTemplate.path = 'static/html_components/overview.html';
		})
	});

	/*
	###############################################################################
	*/


	$scope.rep_string = function(st){ return st.replace(/[A-Z]/g, function(x){ return " " + x; }); }

	/*
	Loads a complete project. Gets the workflows, the strains and the applied pipelines for those strains
	*/
	$scope.showProject = function(){
	    $timeout(function(){

	    	//Get the files available on the user folder on the server side
			single_project.get_user_files(function(response){
        		var t_use = "";
        		for(r in response.data.files){
        			t_use += '<option>' + response.data.files[r] + '</option>';
        		}
        		$('#File_1').append(t_use);
        		$('#File_2').append(t_use);
        	});

			//Only show run and delete strain button if the project is from the current user
        	if(CURRENT_JOB_MINE == false){
        		$("#button_run_strain").css({display:"none"});
        		$("#button_remove_strain").css({display:"none"});
        		$("#button_add_strain").css({display:"none"});

        		$("#buttons_procedures").css({display:"none"});
        		$("#protocols_div").css({display:"none"});
        		$("#procedures_div").css({display:"none"});
        	}
        	else{
        		$("#button_run_strain").css({display:"block"});
        		$("#button_remove_strain").css({display:"block"});
        		$("#button_add_strain").css({display:"block"});

        		$("#group_buttons_strain").css({display:"block"});
        		$("#buttons_procedures").css({display:"block"});
        		$("#procedures_div").css({display:"block"});
        	}

        	//Get all the available workflows (ex: INNUca, chewBBACA, PathoTyping)
            $scope.getWorkflows(function(){
            	//Get all the public strains that can be added to a project
            	$scope.getStrains(function(){
            		//Get the strains already added to the project
            		$scope.getProjectStrains(function(){
            			//Get the pipelines applied to those strains
            			$scope.getAppliedPipelines(null, function(strains_results){
		                	objects_utils.destroyTable('strains_table');
		                	
		                	if(strains_results.strains == "no_pipelines"){	
		                		headers_defs = set_headers_single_project('strains_table', global_strains);
		                		if(headers_defs[1].length != 0){
		                			strains_headers = headers_defs[1];
		                			sh = headers_defs[1];
		                		}
		                		objects_utils.restore_table_headers('strains_table', strains_headers, true, function(){	                		
			                		objects_utils.loadDataTables('strains_table', global_strains, headers_defs[0], strains_headers);
				                	$('#waiting_spinner').css({display:'none'}); 
									$('#single_project_controller_div').css({display:'block'}); 
									$.fn.dataTable.tables( { visible: true, api: true } ).columns.adjust();
								});
		                	}
		                	else{

		                		global_strains = strains_results.strains;

		                		headers_defs = set_headers_single_project('strains_table', global_strains);

		                		strains_headers = headers_defs[1];
		                		sh = headers_defs[1];

		                		objects_utils.restore_table_headers('strains_table', strains_headers, true, function(){	
						        	objects_utils.loadDataTables('strains_table', global_strains, headers_defs[0], strains_headers);
				                	$scope.getIdsFromProjects(function(strains_results){
				                		objects_utils.destroyTable('strains_table');
					                	global_strains = strains_results.strains;
					                	objects_utils.loadDataTables('strains_table', global_strains, headers_defs[0], strains_headers);
					                	$('#waiting_spinner').css({display:'none'}); 
										$('#single_project_controller_div').css({display:'block'}); 
										$.fn.dataTable.tables( { visible: true, api: true } ).columns.adjust();
				                	});
				                });


		                	}
		                });

            			/*
            			Set the jQuery button click for metadata file upload
            			*/
		                $('#fromfileSubmit').on('click', function(e){
							var input_element = document.getElementById('fromfile_file');
						    single_project.load_strains_from_file(input_element, '\t', function(results){
						    });
						  });

		                $('#fromfile_file').on("change", function(){
							$("#file_text").val(this.files[0].name);
						})

		                $('#get_template_file').on('click', function(e){
						    single_project.get_template_strain_file();
						});
		                /*
		                Set the jQuery button click for adding an already available pipeline for a given strain
		                */
						$('#add_pip_from_fileSubmit').on("click", function(){
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
							                	headers_defs = set_headers_single_project('strains_table', global_strains);
							                	objects_utils.restore_table_headers('strains_table', strains_headers, true, function(){	
							                		objects_utils.loadDataTables('strains_table', global_strains, headers_defs[0], strains_headers);
							                	});
											}
							        });
								}
							}
							else modalAlert("All (chosen) strains have a pipeline attached (to them).", function(){});
						})

						$('#add_new_pip_from_fileSubmit').on("click", function(){
							strains_new_without_pip = single_project.get_added_by_file_strains();
							keys_no_pip = Object.keys(strains_new_without_pip);
							counter = 0;
							if(keys_no_pip.length != 0){
								for(z in strains_new_without_pip){
									single_project.add_strain_to_project(strains_new_without_pip[z][1], function(strains_results, strain_name){
											counter += 1;

											if(strains_results.message != undefined) message = '<p>'+strains_results.message+'</p>';
											else message = '<p>New Pipeline applied!</p><p><i class="fa fa-check fa-4x" aria-hidden="true"></i></p>';

											$('#file_col_'+strain_name.replace(/ /g,"_")).empty('<p>'+message+'</p>');
											$('#file_col_'+strain_name.replace(/ /g,"_")).append(message);

											if(strains_results.message == undefined && counter == keys_no_pip.length){
												objects_utils.destroyTable('strains_table');
							                	global_strains = strains_results.strains;
							                	headers_defs = set_headers_single_project('strains_table', global_strains);
							                	objects_utils.restore_table_headers('strains_table', strains_headers, true, function(){	
							                		objects_utils.loadDataTables('strains_table', global_strains, headers_defs[0], strains_headers);
							                	});
											}
							        });
								}
							}
							else modalAlert("There are no strains available to add pipelines.", function(){});
						})

            		});
            	});
            });
            
            $scope.specie_name = CURRENT_SPECIES_NAME;
            $scope.species_id = CURRENT_SPECIES_ID;

	    }, 100);
	}

	/*
	Get all the available workflows that can be used on the project
	Procedure - Something that can be run
	Classifier - Something used for classification (ex: lab protocol)
	*/
	$scope.getWorkflows = function(callback){

		$scope.project = CURRENT_PROJECT;
		
		CURRENT_PROJECT_NAME_ID = CURRENT_PROJECT_ID;
		
		single_project.get_workflows("Procedure", CURRENT_SPECIES_NAME, function(pipelines){
			$scope.pipelines = pipelines;

			single_project.get_workflows("Classifier", CURRENT_SPECIES_NAME, function(pipelines){
				$scope.pipelines_classifiers = pipelines;
				$(".selectpicker").selectpicker({});				
				callback();
			});
		});

	}

	/*
	Apply workflow to a strain or a group of strain.
	*/
	$scope.applyWorkflow = function(type_protocol){

		single_project.apply_workflow('new', type_protocol, function(strain_results){
			for(i in strain_results.selected_indexes){
				global_strains[i] = strain_results.strains[i];
			}
			objects_utils.destroyTable('strains_table');
			headers_defs = set_headers_single_project('strains_table', global_strains);
			objects_utils.restore_table_headers('strains_table', strains_headers, true, function(){	
				objects_utils.loadDataTables('strains_table', global_strains, headers_defs[0], strains_headers);
			});
		});
	}

	/*
	Run all the applied workflows that are able to run for each strain
	*/
	$scope.runPipelines = function(){
		$('#button_run_strain').fadeTo("slow", 0.5).css('pointer-events','none');

		$("#overlayProjects").css({"display":"block"});
		$("#overlayWorking").css({"display":"block"});
		$("#single_project_controller_div").css({"display":"none"});
		$("#submission_status").empty();

		//Check if there are jobs pending or already running. If so, the jobs can't be run again
		single_project.check_if_pending(function(haspending){
			if(haspending == true){
				modalAlert('One or more of the selected strains have jobs already submitted. Please wait until they finish before submit new jobs for those strains.', function(){});
				$('#button_run_strain').fadeTo("slow", 1).css('pointer-events','auto');
				$("#overlayProjects").css({"display":"none"});
				$("#overlayWorking").css({"display":"none"});
				$("#single_project_controller_div").css({"display":"block"});
			}
			else if(haspending == "no_selected"){
				modalAlert('Please select at least one strain to run analysis.', function(){});
				$('#button_run_strain').fadeTo("slow", 1).css('pointer-events','auto');
				$("#overlayProjects").css({"display":"none"});
				$("#overlayWorking").css({"display":"none"});
				$("#single_project_controller_div").css({"display":"block"});
			}
			else{
				//Save the pipelines on the database if required
				single_project.save_pipelines(function(run){
					//Run the pipelines
					if(run == true) single_project.run_pipelines();
					else if(run != "no_select") {
						modalAlert('All processes for the selected strains have been run.', function(){});
						$('#button_run_strain').fadeTo("slow", 1).css('pointer-events','auto');
						$("#overlayProjects").css({"display":"none"});
						$("#overlayWorking").css({"display":"none"});
						$("#single_project_controller_div").css({"display":"block"});
					}
				});
			}
		})
	}

	$scope.myReplace = function(string) {
	    var my_string = string.replace(/ /g, "_");
	    return my_string;
	}

	/*
	Get all the pipelines already applied in other projects to a given strain.  
	*/
	function get_strain_pipeline(strain_ids, callback){
		single_project.get_public_strain_applied_pipelines(strain_ids, function(applied_workflows, strain_ids, pipelines_ids, strains_dict){

			$scope.available_strain_pipelines = applied_workflows;
			$scope.available_pipelines_ids = pipelines_ids;
			
			$('#choosePipelineModal').modal('show');
			
			setTimeout(function(){
				$(".new_pipeline_button").off('click');
				
				//Set the jQuery click on the new pipeline button
				$(".new_pipeline_button").on('click', function(){
					s_id=$(this).attr("strain_id");
					//Add the strain. The new pipeline will only be created at run time
					add_strain([strains_dict[$(this).attr("strain_id")]], function(results){
						if(results.message != undefined){
							$('#pipeline_group_'+s_id.replace(/ /g, "_")).empty();
							$('#pipeline_group_'+s_id.replace(/ /g, "_")).append('<p><b>Strain already on project.</b></p>');
							objects_utils.destroyTable('strains_table');
							headers_defs = set_headers_single_project('strains_table', global_strains);
							objects_utils.restore_table_headers('strains_table', strains_headers, true, function(){	
								objects_utils.loadDataTables('strains_table', global_strains, headers_defs[0], strains_headers);
							});
						}
						else if(results.prevent){
							objects_utils.destroyTable('strains_table');
							headers_defs = set_headers_single_project('strains_table', global_strains);
							objects_utils.restore_table_headers('strains_table', strains_headers, true, function(){	
								objects_utils.loadDataTables('strains_table', global_strains, headers_defs[0], strains_headers);
							});
						}
						else{
							$('#pipeline_group_'+s_id.replace(/ /g, "_")).empty();
							$('#pipeline_group_'+s_id.replace(/ /g, "_")).append('<p><b>New Pipeline applied!</b><i class="fa fa-check fa-2x" aria-hidden="true"></i></p>');
							modalAlert("Strains were added to the project.", function(){});
						}
						
					});
				});

				//Set the jQuery click on a given available pipeline
				
				/*$('.list-group-item').on('click', function(){
					$(".pipeline_strain_button").css({display:"none"});
					$('.list-group-item').removeClass("active");
					$(this).addClass("active");
					$(this).find(".pipeline_strain_button").css({display:"block"});

					$(".pipeline_strain_button").off('click');
					
					//Set the jQuery button to use the available pipeline
					$(".pipeline_strain_button").on('click', function(){
						var p_id = $(this).attr("pipeline");
						var owner_p = $(this).attr("ownerproject");
						var strain_id = strains_dict[$(this).attr("strain_id")];
						var s_id=$(this).attr("strain_id")
						add_strain([strain_id], function(results){
							if(results.message != undefined) return callback({message:results.message});
							else{
								//Apply pipeline to the strain and add them to the project
								single_project.get_and_apply_pipeline(1, p_id, strain_id, owner_p, function(response){
									//Get the status of the processes used in that pipeline
									$scope.getIdsFromProjects(function(strains_results){
				                		objects_utils.destroyTable('strains_table');
					                	global_strains = strains_results.strains;
					                	headers_defs = set_headers_single_project(global_strains);
					                	objects_utils.restore_table_headers('strains_table', strains_headers, true, function(){	
					                		objects_utils.loadDataTables('strains_table', global_strains, headers_defs[0], strains_headers);
						                	$('#pipeline_group_'+s_id.replace(/ /g, "_")).empty();
											$('#pipeline_group_'+s_id.replace(/ /g, "_")).append('<p><b>Pipeline applied!</b><i class="fa fa-check fa-2x" aria-hidden="true"></i></p>');
											modalAlert("Strains were added to the project.", function(){});
						                	callback({strain_id:strain_id});
						                });
				                	});
								})
							}
						});
					});
				});*/

			}, 200);
		})
	}

	get_sp = get_strain_pipeline;

	/*
	Function to add a strain from the database
	*/
	function add_strain(strain_ids, callback){
		single_project.add_database_strains(strain_ids, function(strains_results){
			if(strains_results.message != undefined) return callback(strains_results);
			objects_utils.destroyTable('strains_table');
			global_strains = strains_results.strains;
			headers_defs = set_headers_single_project('strains_table', global_strains);
			CURRENT_TABLE_ROWS_SELECTED['strains_table'] = [];
			CURRENT_TABLE_ROW_ANALYSIS_SELECTED['strains_table'] = [];
			objects_utils.restore_table_headers('strains_table', strains_headers, true, function(){	
				objects_utils.loadDataTables('strains_table', global_strains, headers_defs[0], strains_headers);
				callback(strains_results);
			});
		});
	}

	/*
	Shows all the avaibale pipelines for a group of selected strains from the database
	*/
	$scope.add_Database_Strains = function(){

		var strainids = $.map($('#public_strains_table').DataTable().rows('.selected').data(), function(item){
		        return item['strainID'];
		});
		get_strain_pipeline(strainids, function(){
		})
	}

	/*
	Add a new strain to the project. The pipeline is only created at run time
	*/
	$scope.add_New_Strain = function(){
		single_project.add_new_strain(trigger_from_file_load, function(strains_results, is_from_file){
			if(strains_results.already_there) return;
			if(is_from_file != true) modalAlert('Strain added to the project.', function(){});
			objects_utils.destroyTable('strains_table');
			global_strains = strains_results.strains;
			headers_defs = set_headers_single_project('strains_table', global_strains);
			CURRENT_TABLE_ROWS_SELECTED['strains_table'] = [];
			CURRENT_TABLE_ROW_ANALYSIS_SELECTED['strains_table'] = [];
			objects_utils.restore_table_headers('strains_table', strains_headers, true, function(){	
				objects_utils.loadDataTables('strains_table', global_strains, headers_defs[0], strains_headers);
			});
			setTimeout(function(){
				$("#change_type_to_form").trigger("click");
			}, 300);
		});
	}

	$scope.change_type_to_form = function(){
		trigger_from_file_load = false;
	}

	$scope.change_type_to_file = function(){
		trigger_from_file_load = true;
	}

	/*
	Get the public strains stored in the database
	*/
	$scope.getStrains = function(callback){

		single_project.get_strains(false, function(strains_results){
		    objects_utils.destroyTable('public_strains_table');
		    global_public_strains = strains_results.public_strains;
		    headers_defs = set_headers_single_project('public_strains_table', global_public_strains);

		    objects_utils.restore_table_headers('public_strains_table', strains_headers, true, function(){	
			    objects_utils.loadDataTables('public_strains_table', global_public_strains, headers_defs[0], strains_headers);
			    callback();
			});
		});

	}

	/*
	Get strains already attached to the project
	*/
	$scope.getProjectStrains = function(callback){

		single_project.get_project_strains(function(strains_results){
			global_strains = strains_results.strains;
			headers_defs = set_headers_single_project('strains_table', global_strains);

			objects_utils.restore_table_headers('strains_table', strains_headers, true, function(){	
				objects_utils.loadDataTables('strains_table', global_strains, headers_defs[0], strains_headers);
				callback();
			});

		});
	}

	/*
	Add strain to project. 
	DEPRECATED?
	*/
	$scope.addStrainToProject = function(strain_name){

		single_project.add_strain_to_project(strain_name, function(strains_results){
			objects_utils.destroyTable('strains_table');
			global_strains = strains_results.strains;
			headers_defs = set_headers_single_project('strains_table', global_strains);
			objects_utils.restore_table_headers('strains_table', strains_headers, true, function(){	
				//objects_utils.loadDataTables('strains_table', global_strains, headers_defs[0], strains_headers);
				modalAlert("Strains were added to the project.", function(){});
			});
		});

	}

	/*
	Remove strains from the project
	*/
	$scope.removeStrainsFromProject = function(){

		single_project.remove_strains_from_project(global_strains, function(strains_results){
			if (strains_results == "no_select") modalAlert("Please select a strain to remove.", function(){});
			else{
				objects_utils.destroyTable('strains_table');
				global_strains = strains_results.strains;
				headers_defs = set_headers_single_project('strains_table', global_strains);
				objects_utils.restore_table_headers('strains_table', strains_headers, true, function(){	
					CURRENT_TABLE_ROWS_SELECTED['strains_table'] = [];
					CURRENT_TABLE_ROW_ANALYSIS_SELECTED['strains_table'] = [];
					objects_utils.loadDataTables('strains_table', global_strains, headers_defs[0], strains_headers);
				});
			}
		});
	}

});


/*
DEPRECATED?
*/
showCombinedReports = function(li){
	single_project.show_combined_reports(li.className);
}

/*
Get the results file from a workflow
*/
getProcessesOutputs = function(li){
	single_project.get_processes_outputs(li.className, function(response){
		//Download only the result file from all the outputs
		single_project.download_result(response, function(response){
		})
	});
}

/*
Get the run log from a workflow
*/
getProcessesLog = function(li){
	single_project.get_processes_outputs(li.className, function(response){
		//Download only the log file from all the outputs
		single_project.download_log(response, function(response){
		})
	});
}

/*
Remove a workflow from a pipeline
*/
removeAnalysis = function(li){
	var objects_utils = new Objects_Utils();
	single_project.remove_analysis(li, function(strain_results){
		for(i in strain_results.selected_indexes){
			global_strains[i] = strain_results.strains[i];
		}
		objects_utils.destroyTable('strains_table');
		headers_defs = set_headers_single_project('strains_table', global_strains);
		objects_utils.restore_table_headers('strains_table', sh, true, function(){	
			objects_utils.loadDataTables('strains_table', global_strains, headers_defs[0], sh);
		});
	});
}

/*
Check available pipelines if a strain loaded trough a file already exists
*/
checkPipelineFromFile = function(element){
	get_sp([$(element).attr("strain_name")], function(results){
		$('#choosePipelineModal').modal('hide');
		$('#file_col_'+$(element).attr("strain_name").replace(/ /g,"_")).empty();

		if(results.message != undefined) $('#file_col_'+$(element).attr("strain_name").replace(/ /g,"_")).append('<p>'+results.message+'</p><p><i class="fa fa-close fa-4x" aria-hidden="true"></i></p>');
		else $('#file_col_'+$(element).attr("strain_name").replace(/ /g,"_")).append('<p>Pipeline applied!</p><p><i class="fa fa-check fa-4x" aria-hidden="true"></i></p>');
	});
}

/*
Add a new pipeline if a strain loaded trhough a file already exists
*/
newPipelineFromFile = function(element){
	var objects_utils = new Objects_Utils();
	single_project.add_strain_to_project($(element).attr("strain_name"), function(strains_results, strain_name){
		objects_utils.destroyTable('strains_table');
		global_strains = strains_results.strains;
		headers_defs = set_headers_single_project('strains_table', global_strains);
		objects_utils.restore_table_headers('strains_table', sh, true, function(){	
			objects_utils.loadDataTables('strains_table', global_strains, headers_defs[0], sh);
			$('#file_col_'+strain_name.replace(/ /g,"_")).empty();
			$('#file_col_'+strain_name.replace(/ /g,"_")).append('<p>New Pipeline applied!</p><p><i class="fa fa-check fa-4x" aria-hidden="true"></i></p>');
			modalAlert('Strain added to the project.', function(){});
		});
	});
}