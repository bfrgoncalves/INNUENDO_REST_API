innuendoApp.controller("downloadsCtrl", ($scope, $http) => {

    current_scope_template = $scope.selectedTemplate.path;

    const backButtonEl = $("#backbutton");

    if(PREVIOUS_PAGE_ARRAY.length > 0) backButtonEl.css({"display":"block"});
    else backButtonEl.css({"display":"none"});

    backButtonEl.off("click").on("click", () => {
        $scope.$apply( () => {
            $scope.selectedTemplate.path = PREVIOUS_PAGE_ARRAY.pop();
        })
    });

    const pg_requests = Requests(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http);

    $("#reset_strain").on("click", () => {
        $scope.$apply( () => {
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
        });
    });

    //RESET ROW SELECTION
    CURRENT_TABLE_ROW_ANALYSIS_SELECTED = {};
    CURRENT_TABLE_ROWS_SELECTED = {};

	$scope.download_accessions = (item) => {

	    const reader = new FileReader();

        const down_loop = (lines) => {

            const downloadStatus = $('#download_results_status');

            if(lines.length === 0){
                downloadStatus.append("<p>Finished!</p>");
                return;
            }
            
            let line = lines.pop();

            downloadStatus.append("<p id='download_"+line+"'>Downloading" +
                " accession "+line+"...</p>");

            pg_requests.download_accession(CURRENT_USER_NAME, line, (response, line_name) => {

                let out_file = response.data.output_file_id;

                let interval = setInterval( () => {
                    pg_requests.check_download_accession_status(out_file, line_name, (response, line_name) => {

                        if(response.data.output.length !== 0){
                            let text = "";
                            let to_write = false;
                            for(const x in response.data.output){
                                if(response.data.output[x].indexOf("Download" +
                                        " ") > -1) {
                                    to_write = true;
                                }
                                if(to_write) {
                                    text += response.data.output[x];
                                }
                            }
                            $('#download_results_status').append('<p>'+text+'</p><hr>');

                            clearInterval(interval);
                            down_loop(lines);
                        }
                        else{
                            const downloadTimeEl = $('#download_'+line_name);
                            downloadTimeEl.text(downloadTimeEl.text() + ".");
                        }
                    });
                }, 10000);

            });

        };

      	reader.onload = (f) => {
	      	let lines = this.result.split('\n');
            $('#download_results_status').append("<p>"+lines.length+" accessions to download:</p>");
            down_loop(lines);
	      	

	    };

	    const input_element = document.getElementById('listfile_file');

	    if(item.target.id === "download_button_file" && input_element.files.length !== 0){
            reader.readAsText(input_element.files[0]);
        }
        else if (item.target.id === "download_button_single" && $('#input_accession').val() !== ""){
            $('#download_results_status').append("<p>1 accession to download:</p>");
        	down_loop([$('#input_accession').val()]);
        }
        else return null;

    };

    $('#listfile_file').on("change", () => {
		$("#list_text").val(this.files[0].name);
	});

    
});