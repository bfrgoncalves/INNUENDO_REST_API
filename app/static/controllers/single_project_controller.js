innuendoApp.controller("projectCtrl", function($scope, $http) {

	$scope.project = {};
	$scope.pipelines, $scope.strains, $scope.strains_headers, $scope.public_strains, $scope.fileType = [];
    $scope.specie_name, $scope.species_id = "";

    single_project = new Single_Project(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http);

    $scope.getAppliedPipelines = single_project.get_applied_pipelines;
	$scope.createPipeline = single_project.create_pipeline;
	$scope.getIdsFromProjects = single_project.get_ids_from_processes;
	//$scope.savePipelines = single_project.save_pipelines;

	var objects_utils = new Objects_Utils();

	var metadata = new Metadata();

	metadata.add_owner(CURRENT_USER_NAME);

	$scope.metadata_fields = metadata.get_fields();

	$scope.rep_string = function(st){ return st.replace(/[A-Z]/g, function(x){ return " " + x; }); }


	$scope.showProject = function(){
	    setTimeout(function(){
	        $scope.$apply(function(){

				$scope.fileType = {'File_1': 'File 1 path on INNUENDO User folder'}

	            $scope.getWorkflows();
	            $scope.getStrains();
	            $scope.getProjectStrains();
	            $scope.specie_name = CURRENT_SPECIES_NAME;
	            $scope.species_id = CURRENT_SPECIES_ID;

	            setTimeout(function(){
	                $scope.getAppliedPipelines(function(){
	                	$scope.getIdsFromProjects();
	                });
	            }, 1000);
	        });

	        $('#file_selector').change(function(){
				console.log(this.value);
				fileT = this.value;
				$scope.$apply(function(){
					if(fileT == 'Reads: Paired End') $scope.fileType = {'File_1': 'File 1 path on INNUENDO User folder', 'File_2': 'File 2 path on INNUENDO User folder'}
					else if(fileT == 'Reads: Single End') $scope.fileType = {'File_1': 'File 1 path on INNUENDO User folder'}
					else if(fileT == 'Assembly') $scope.fileType = {'File_1': 'File 1 path on INNUENDO User folder'}
				});
			});
	    }, 50);
	}

	$scope.getWorkflows = function(){

		$scope.project = CURRENT_PROJECT;
		single_project.get_workflows(function(pipelines){
			console.log(pipelines);
			$scope.pipelines = pipelines;
		});

	}

	$scope.applyWorkflow = function(){
		single_project.apply_workflow(function(){
			console.log('APPly');
		});
	}

	$scope.runPipelines = function(){
		single_project.save_pipelines(function(){
			console.log('Save');
			single_project.run_pipelines();
			console.log('Run');
		});
	}

	$scope.add_Database_Strains = function(){
		
		function add_strain(callback){
			single_project.add_database_strains(function(strains_results){
				var dict_fields = metadata.get_dict_fields();
				var keys = Object.keys(dict_fields);
				var real_headers = [];
				var strains = []
				var strain_keys = Object.keys(strains_results.strains[0]);
				for(x in strains_results.strains){
					var strain = {}
					keys.map(function(key){
						strain[dict_fields[key]] = strains_results.strains[x][dict_fields[key]]
					});
					strains.push(strain);
				}

				$scope.strains_headers = keys;
				$scope.strains = strains;
				callback();
			});
		}
		add_strain(function(){
			objects_utils.loadDataTables('strains_table', $scope.strains);
		});
	}

	$scope.add_New_Strain = function(){
		single_project.add_new_strain(function(strains_results){
			var dict_fields = metadata.get_dict_fields();
			var keys = Object.keys(dict_fields);
			var real_headers = [];
			var strains = []
			var strain_keys = Object.keys(strains_results.strains[0]);
			for(x in strains_results.strains){
				var strain = {}
				keys.map(function(key){
					strain[dict_fields[key]] = strains_results.strains[x][dict_fields[key]]
				});
				strains.push(strain);
			}

			$scope.strains_headers = keys;
			$scope.strains = strains;
			objects_utils.loadDataTables('strains_table', $scope.strains);
		});
	}

	$scope.getStrains = function(){

		single_project.get_strains(function(strains_results){
		    $scope.public_strains_headers = strains_results.public_strains_headers;
		    //$scope.strains_headers = strains_results.public_strains_headers;
		    console.log(strains_results.public_strains_headers);
		    $scope.public_strains = strains_results.public_strains;
		    objects_utils.loadDataTables('public_strains_table', $scope.public_strains);
		});

	}

	$scope.getProjectStrains = function(){

		single_project.get_project_strains(function(strains_results){
			var dict_fields = metadata.get_dict_fields();
			var keys = Object.keys(dict_fields);
			var real_headers = [];
			var strains = []
			var strain_keys = Object.keys(strains_results.strains[0]);
			for(x in strains_results.strains){
				var strain = {}
				keys.map(function(key){
					strain[dict_fields[key]] = strains_results.strains[x][dict_fields[key]]
				});
				strains.push(strain);
			}

			$scope.strains_headers = keys;
			$scope.strains = strains;
			objects_utils.loadDataTables('strains_table', $scope.strains);
		});
	}

	$scope.addStrainToProject = function(strain_name){

		single_project.add_strain_to_project(strain_name, function(strains_results){
			$scope.$apply(function(){
				console.log(strains_results.strains_headers);
				console.log(strains_results.strains);
				$scope.strains_headers = strains_results.strains_headers;
				$scope.strains = strains_results.strains;
				objects_utils.loadDataTables('strains_table', $scope.strains);
			})
		});

	}

	$scope.removeStrainsFromProject = function(){

		single_project.remove_strains_from_project($scope.strains, function(strains_results){
			$scope.$apply(function(){
				$scope.strains = strains_results.strains;
				objects_utils.loadDataTables('strains_table', $scope.strains);
			})
		});
	}


});
