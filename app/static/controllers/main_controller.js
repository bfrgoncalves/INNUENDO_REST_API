var innuendoApp = angular.module("innuendoApp", []);

var CURRENT_PROJECT_ID = "";
var CURRENT_PROJECT = {};
var CURRENT_SPECIES_ID = "";
var CURRENT_SPECIES_NAME = "";

var protocols = {};
var protocol_types = [];

$('a').click(function(){
	$(this).parent().addClass("active").siblings().removeClass("active");
});

/*
$("tbody").on("click", "tr", function(e) {     
  $(this)
     .toggleClass("selected")
     .siblings(".selected")
         .removeClass("selected");
});
*/

setTimeout(function(){
	$('#overviewLink').trigger('click');

	$('#offcanvasleft').click(function() {
	  $('.row-offcanvas-left').toggleClass('active');
	});

	$('.nav-a').click(function() {
	  $('.row-offcanvas-left').toggleClass('active');
	});

}, 100);