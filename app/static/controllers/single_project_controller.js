innuendoApp.controller("projectCtrl", function($scope, $http) {

	$scope.project = {};
	$scope.pipelines, $scope.strains, $scope.strains_headers, $scope.public_strains, $scope.files = [];
    $scope.specie_name, $scope.species_id = "";

    single_project = new Single_Project(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http);

    $scope.getAppliedPipelines = single_project.get_applied_pipelines;
	$scope.add_New_Strain = single_project.add_new_strain;
	$scope.applyWorkflow = single_project.apply_workflow;
	$scope.createPipeline = single_project.create_pipeline;
	$scope.savePipelines = single_project.save_pipelines;
	$scope.runPipelines = single_project.run_pipelines;

	var objects_utils = new Objects_Utils();

	var metadata = new Metadata();

	metadata.add_owner(CURRENT_USER_NAME);

	$scope.metadata_fields = metadata.get_fields();


	$scope.showProject = function(){
	    setTimeout(function(){
	        $scope.$apply(function(){

				single_project.get_uploaded_files(function(files){
					$scope.files = files;
				});

	            $scope.getWorkflows();
	            $scope.getStrains();
	            $scope.getProjectStrains();
	            $scope.specie_name = CURRENT_SPECIES_NAME;
	            $scope.species_id = CURRENT_SPECIES_ID;

	            setTimeout(function(){
	                $scope.getAppliedPipelines();
	            }, 1000);
	        });
	    }, 50);
	}

	$scope.getWorkflows = function(){

		$scope.project = CURRENT_PROJECT;
		single_project.get_workflows(function(pipelines){
			$scope.pipelines = pipelines;
		});

	}

	$scope.add_Database_Strains = function(){
		
		function add_strain(callback){
			single_project.add_database_strains(function(strains_results){
				$scope.strains_headers = strains_results.strains_headers;
				$scope.strains = strains_results.strains;
				callback();
			});
		}
		add_strain(function(){
			objects_utils.loadDataTables('strains_table', $scope.strains);
		});
	}

	$scope.getStrains = function(){

		single_project.get_strains(function(strains_results){
		    $scope.public_strains_headers = strains_results.public_strains_headers;
		    $scope.strains_headers = strains_results.public_strains_headers;
		    $scope.public_strains = strains_results.public_strains;
		    objects_utils.loadDataTables('public_strains_table', $scope.public_strains);
		});

	}

	$scope.getProjectStrains = function(){

		single_project.get_project_strains(function(strains_results){
			$scope.strains_headers = strains_results.strains_headers;
			$scope.strains = strains_results.strains;
			objects_utils.loadDataTables('strains_table', $scope.strains);
		});
	}

	$scope.addStrainToProject = function(strain_name){

		single_project.add_strain_to_project(strain_name, function(strains_results){
			$scope.strains_headers = strains_results.strains_headers;
			$scope.strains = strains_results.strains;
			objects_utils.loadDataTables('strains_table', $scope.strains);
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
