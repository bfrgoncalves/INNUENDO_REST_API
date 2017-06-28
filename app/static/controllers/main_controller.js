var innuendoApp = angular.module("innuendoApp", []);

var CURRENT_PROJECT_ID = "";
var CURRENT_JOB_MINE = "";
var CURRENT_PROJECT = {};
var CURRENT_SPECIES_ID = "";
var CURRENT_SPECIES_NAME = "";
var CURRENT_USER_NAME = current_user_name;
var CURRENT_JOBS_ROOT = jobs_root;

console.log(CURRENT_USER_NAME);

var CURRENT_JOB_ID = "";
var CURRENT_PROJECT_NAME_ID = "";

console.log(jobs_root);


var current_job_status_color = {};

var protocols = {};
var protocol_types = [];

/*
*
*
DEFINE ANALYSIS PARAMETERS FOR METADATA
*
*
*/

var ANALYSYS_PARAMETERS = {"INNUca": {"#samples":false, "MLST_ST": true, "MLST_scheme": true, "Pilon_changes": false, "Pilon_contigs_changed": false, "SPAdes_filtered_bp": false, "SPAdes_filtered_contigs": false, "SPAdes_number_bp": false, "assembly_coverage_filtered": true, "assembly_coverage_initial": false, "final_assembly": false, "first_coverage": false, "mapped_reads_percentage": false, "mapping_filtered_bp": true, "mapping_filtered_contigs": true, "pear_assembled_reads": false, "pear_discarded_reads": false, "pear_unassembled_reads": false, "second_Coverage": false, "trueCoverage_absent_genes": false, "trueCoverage_multiple_alleles": false, "trueCoverage_sample_coverage": true},
						   "chewBBACA": {"EXC": true, "INF": true, "LNF": true, "PLOT": true, "NIPH": true, "ALM": true, "ASM": true},
						   "PathoTyping": {"result":true}
						  };

var INFO_OR_RESULTS = {"chewBBACA": 0, "PathoTyping": 1, "INNUca": 1}


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
		tclick();
	})

	$("#sidebar-wrapper ul li").not('.navbar ul .drop').on("click", function(){
		tclick();
	})
	$(".nav-list li").on("click", function(){
		tclick();
	})

}, 800);