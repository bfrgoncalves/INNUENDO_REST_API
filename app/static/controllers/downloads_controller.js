innuendoApp.controller("downloadsCtrl", function($scope, $http) {

    current_scope_template = $scope.selectedTemplate.path;
    if(PREVIOUS_PAGE_ARRAY.length > 0) $("#backbutton").css({"display":"block"});
    else $("#backbutton").css({"display":"none"});

    $("#backbutton").off("click");
    $("#backbutton").on("click", function(){
        $scope.$apply(function(){
            $scope.selectedTemplate.path = PREVIOUS_PAGE_ARRAY.pop();
        })
    });

    var pg_requests = new Requests(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http);

    $("#reset_strain").on("click", function(){
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

	$scope.download_accessions = function(item){

	    var reader = new FileReader();

        function down_loop(lines){

            if(lines.length == 0){
                $('#download_results_status').append("<p>Finished!</p>");
                return;
            }
            
            var line = lines.pop();

            $('#download_results_status').append("<p id='download_"+line+"'>Downloading accession "+line+"...</p>");

            pg_requests.download_accession(CURRENT_USER_NAME, line, function(response, line_name){
                console.log(response);
                var out_file = response.data.output_file_id;
                var interval = setInterval(function(){
                    pg_requests.check_download_accession_status(out_file, line_name, function(response, line_name){
                        console.log(response, line_name);
                        if(response.data.output.length != 0){
                            var text = "";
                            var to_write = false;
                            for(x in response.data.output){
                                if(response.data.output[x].indexOf("Download ") > -1) to_write = true;
                                if(to_write) text += response.data.output[x];
                            }
                            $('#download_results_status').append('<p>'+text+'</p><hr>');
                            last_size = response.data.output.length;
                            clearInterval(interval);
                            down_loop(lines);
                        }
                        else{
                            $('#download_'+line_name).text($('#download_'+line_name).text() + ".");
                        }
                    });
                }, 10000);

            });

        }

      	reader.onload = function(f){
	      	var lines = this.result.split('\n');
            $('#download_results_status').append("<p>"+lines.length+" accessions to download:</p>");
            down_loop(lines);
	      	

	    };

	    var input_element = document.getElementById('listfile_file');

	    if(item.target.id == "download_button_file" && input_element.files.length != 0){
            reader.readAsText(input_element.files[0]);
        }
        else if (item.target.id == "download_button_single" && $('#input_accession').val() != ""){
            $('#download_results_status').append("<p>1 accession to download:</p>");
        	down_loop([$('#input_accession').val()]);
        }
        else return null;

    }

    $('#listfile_file').on("change", function(){
		$("#list_text").val(this.files[0].name);
	})

    
});