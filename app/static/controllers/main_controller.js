/*
Main controller - Main controller of the application. Defines global variables and the innuendoApp global controller.
Global configuration of the app is also defined here.
	- Analysyis parameters for metadata
	- location of information and results for each program
*/

//Define global controller 
const innuendoApp = angular.module("innuendoApp", []);

/*
Define global variables that are modified in every controller
 */
let CURRENT_PROJECT_ID = "";
let CURRENT_JOB_MINE = "";
let CURRENT_PROJECT = {};
let CURRENT_SPECIES_ID = "";
let CURRENT_SPECIES_NAME = "";
let CURRENT_USER_NAME = current_user_name;
let CURRENT_USER_ID = current_user_id;
let CURRENT_JOBS_ROOT = jobs_root;
let HOME_DIR = homedir;

let CURRENT_JOB_ID = "";
let CURRENT_PROJECT_NAME_ID = "";
let CURRENT_TABLE_ROWS_SELECTED = {};
let CURRENT_TABLE_ROW_ANALYSIS_SELECTED = {};

let current_job_status_color = {};

let protocols = {};
let protocol_types = [];
let intervals_running = {};
let strainName_to_tids = {};
let pipeline_status = {};
let jobs_to_parameters = {};

/*
DEFINE ANALYSIS PARAMETERS FOR METADATA
*/
let ANALYSYS_PARAMETERS = {"INNUca": {"#samples":false, "MLST_ST": true, "MLST_scheme": true, "Pilon_changes": false, "Pilon_contigs_changed": false, "SPAdes_filtered_bp": false, "SPAdes_filtered_contigs": false, "SPAdes_number_bp": false, "assembly_coverage_filtered": true, "assembly_coverage_initial": false, "final_assembly": false, "first_coverage": false, "mapped_reads_percentage": false, "mapping_filtered_bp": true, "mapping_filtered_contigs": true, "pear_assembled_reads": false, "pear_discarded_reads": false, "pear_unassembled_reads": false, "second_Coverage": false, "trueCoverage_absent_genes": false, "trueCoverage_multiple_alleles": false, "trueCoverage_sample_coverage": true},
    "chewBBACA": {"EXC": true, "INF": true, "LNF": true, "PLOT": true, "NIPH": true, "ALM": true, "ASM": true},
    "PathoTyping": {"result":true}
};

const INFO_OR_RESULTS = {"chewBBACA": 0, "PathoTyping": 1, "INNUca": 1}


let PREVIOUS_PAGE_ARRAY = [];
let current_scope_template = "";

$('a').click( (e) => {
    $(e.target).parent().addClass("active").siblings().removeClass("active");
});

const tclick = () => {
    $("#button_ham_navbar")[0].click();
};

const sendMail = () => {
    let pg_requests = Requests("", "", "");
    pg_requests.sendCustomMail(
        $("#recipients").val(),
        $("#email-title").val(),
        $("#email-body").val()
    );
};

/**
 * Function to trigger some events on main controller start
 */
setTimeout( () => {
    $('#overviewLink').trigger('click');

    $("#send_mail").off("click").on("click", () => {
        $("#newMailModal").modal("show");
    });

    $('#offcanvasleft').click(function() {
        $('.row-offcanvas-left').toggleClass('active');
    });

    $('.nav-a').click(function() {
        $('.row-offcanvas-left').toggleClass('active');
    });

    $(".dropdiv ul li").on("click", function(){
        PREVIOUS_PAGE_ARRAY.push([current_scope_template, CURRENT_PROJECT_ID, CURRENT_JOB_MINE, CURRENT_PROJECT, CURRENT_SPECIES_ID, CURRENT_SPECIES_NAME, CURRENT_USER_NAME, CURRENT_JOBS_ROOT, CURRENT_JOB_ID, CURRENT_PROJECT_NAME_ID, CURRENT_TABLE_ROWS_SELECTED, CURRENT_TABLE_ROW_ANALYSIS_SELECTED]);
        tclick();
    })

    $("#sidebar-wrapper ul li").not('.navbar ul .drop, .dropdiv ul li').on("click", function(){
        PREVIOUS_PAGE_ARRAY.push([current_scope_template, CURRENT_PROJECT_ID, CURRENT_JOB_MINE, CURRENT_PROJECT, CURRENT_SPECIES_ID, CURRENT_SPECIES_NAME, CURRENT_USER_NAME, CURRENT_JOBS_ROOT, CURRENT_JOB_ID, CURRENT_PROJECT_NAME_ID, CURRENT_TABLE_ROWS_SELECTED, CURRENT_TABLE_ROW_ANALYSIS_SELECTED]);
        tclick();
    })
    $(".nav-list li").not('.dropdiv ul li').on("click", function(){
        PREVIOUS_PAGE_ARRAY.push([current_scope_template, CURRENT_PROJECT_ID, CURRENT_JOB_MINE, CURRENT_PROJECT, CURRENT_SPECIES_ID, CURRENT_SPECIES_NAME, CURRENT_USER_NAME, CURRENT_JOBS_ROOT, CURRENT_JOB_ID, CURRENT_PROJECT_NAME_ID, CURRENT_TABLE_ROWS_SELECTED, CURRENT_TABLE_ROW_ANALYSIS_SELECTED]);
        tclick();
    })

}, 800);