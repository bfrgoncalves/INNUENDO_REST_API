var innuendoApp = angular.module("innuendoApp", []);

var CURRENT_PROJECT_ID = "";
var CURRENT_PROJECT = {};
var CURRENT_SPECIES_ID = "";
var CURRENT_SPECIES_NAME = "";
var CURRENT_USER_NAME = current_user_name;

var protocols = {};
var protocol_types = [];

$('a').click(function(){
	$(this).parent().addClass("active").siblings().removeClass("active");
});


setTimeout(function(){
	$('#overviewLink').trigger('click');

	$('#offcanvasleft').click(function() {
	  $('.row-offcanvas-left').toggleClass('active');
	});

	$('.nav-a').click(function() {
	  $('.row-offcanvas-left').toggleClass('active');
	});

}, 100);