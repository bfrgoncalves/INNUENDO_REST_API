/*
Main controller - Main controller of the application. Defines global variables and the innuendoApp global controller.
Global configuration of the app is also defined here.
	- Analysyis parameters for metadata
	- location of information and results for each program
*/

//Define global controller 
var innuendoApp = angular.module("innuendoApp", []);

var CURRENT_PROJECT_ID = "";
var CURRENT_JOB_MINE = "";
var CURRENT_PROJECT = {};
var CURRENT_SPECIES_ID = "";
var CURRENT_SPECIES_NAME = "";
var CURRENT_USER_NAME = current_user_name;
var CURRENT_USER_ID = current_user_id;
var CURRENT_JOBS_ROOT = jobs_root;

var CURRENT_JOB_ID = "";
var CURRENT_PROJECT_NAME_ID = "";
var CURRENT_TABLE_ROWS_SELECTED = {};
var CURRENT_TABLE_ROW_ANALYSIS_SELECTED = {};

var current_job_status_color = {};

var protocols = {};
var protocol_types = [];

/*
DEFINE ANALYSIS PARAMETERS FOR METADATA
*/
var ANALYSYS_PARAMETERS = {"INNUca": {"#samples":false, "MLST_ST": true, "MLST_scheme": true, "Pilon_changes": false, "Pilon_contigs_changed": false, "SPAdes_filtered_bp": false, "SPAdes_filtered_contigs": false, "SPAdes_number_bp": false, "assembly_coverage_filtered": true, "assembly_coverage_initial": false, "final_assembly": false, "first_coverage": false, "mapped_reads_percentage": false, "mapping_filtered_bp": true, "mapping_filtered_contigs": true, "pear_assembled_reads": false, "pear_discarded_reads": false, "pear_unassembled_reads": false, "second_Coverage": false, "trueCoverage_absent_genes": false, "trueCoverage_multiple_alleles": false, "trueCoverage_sample_coverage": true},
						   "chewBBACA": {"EXC": true, "INF": true, "LNF": true, "PLOT": true, "NIPH": true, "ALM": true, "ASM": true},
						   "PathoTyping": {"result":true}
						  };

var INFO_OR_RESULTS = {"chewBBACA": 0, "PathoTyping": 1, "INNUca": 1}
/*
*/

var PREVIOUS_PAGE_ARRAY = [];
var current_scope_template = "";

$('a').click(function(){
	$(this).parent().addClass("active").siblings().removeClass("active");
});

function tclick(){
	$("#button_ham_navbar")[0].click();
}

setTimeout(function(){
	$('#overviewLink').trigger('click');

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