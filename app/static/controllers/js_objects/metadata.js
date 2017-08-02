/*
Metadata Object - An object with all functions used in the metadata management
 - add_owner
 - get_fields
 - get_dict_fields
 - get_dict_fields_reverse
 - get_minimal_fields
*/

/*
Launch a metadata instance
*/
function Metadata(){

	var metadata_object = {};
	var data_owner = "";

	//Type of html input to be generated for each of the metadata fields on the new strain form
	var fields = {

		"Strain Identifier": [ {"Primary": "text"}, {"Food-Bug": "text"}],
		"Date": [{"SamplingDate": "date"}, {"SampleReceivedDate": "date"}],
		"Source": [{"Source": ["Human", "Food", "Animal, cattle", "Animal, poultry", "Animal, swine", "Animal, other", "Environment", "Water"]}],
		"Owner": [{"Owner": "text disabled"}],
		"Submitter": [{"Submitter": "text", "data": ""}],
		"Additional Information": [{"AdditionalInformation": "text", "maxlength":"10"}],
		"Location": [{"Location": "text disabled"}]
	}

	//Conversion from the metadata fields stored in the db to how we want to see them on a table
	var dict_fields = {
		"Strain Name": "strainID",
		"Species ID": "species_id",
		"Received Date": "SampleReceivedDate",
		"Source": "source_Source",
		"Owner": "Owner",
		"Submitter":"Submitter",
		"Max Length":"maxlength",
		"Location": "Location",
		"File 1": "File_1",
		"File 2": "File_2",
		"Primary": "Primary",
		"Sampling Date": "SamplingDate",
		"Case ID": "Food-Bug",
		"Additional Info": "AdditionalInformation",
		"More Info": "More Info",
		"Analysis": "Analysis"
	}

	//Conversion from the metadata fields stored in the db to how we want to see them on a table (Reverse)
	var dict_fields_reverse = {
		"strainID":"Strain Name",
		"species_id":"Species ID",
		"SampleReceivedDate":"Received Date",
		"source_Source":"Source",
		"Owner":"Owner",
		"Submitter":"Submitter",
		"maxlength":"Max Length",
		"Location":"Location",
		"File_1": "File 1",
		"File_2": "File 2",
		"Primary":"Primary",
		"SamplingDate":"Sampling Date",
		"Food-Bug":"Case ID",
		"AdditionalInformation":"Additional Info",
		"More Info": "More Info",
		"Analysis": "Analysis",
		"Process ID": "job_id"
		"Sample": "Sample"
	}

	//The minimum headers to be seen on a table
	var minimal_headers = ["Strain Name", "Received Date", "Source", "Additional Info", "File 1", "Primary", "Sampling Date", "Owner", "Case ID", "Submitter", "File 2", "Location", "Sample", "Process ID"];
	var default_headers = ["Strain Name", "Received Date", "Source", "Sampling Date", "Location"];

	return {

		/*
		Add a owner
		*/
		add_owner: function(owner_info){
			fields["Submitter"][0]["data"] = owner_info;
			return owner_info;
		},

		/*
		Get the html input correspondence object
		*/
		get_fields: function(){
			return fields;
		},

		/*
		Get the conversion fields object
		*/
		get_dict_fields: function(){
			return dict_fields;
		},

		/*
		Get the conversion fields object (reverse)
		*/
		get_dict_fields_reverse: function(){
			return dict_fields_reverse;
		},

		/*
		Get the minimal headers
		*/
		get_minimal_fields: function(){
			return minimal_headers;
		},

		/*
		Get default headers
		*/
		get_default_headers: function(){
			return default_headers;
		}
	}
}