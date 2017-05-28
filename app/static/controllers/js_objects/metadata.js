function Metadata(){

	var metadata_object = {};
	var data_owner = "";

	var fields = {

		"Strain Identifier": [ {"Primary": "text"}, {"Food-Bug": "text"}],
		"Date": [{"SamplingDate": "date"}, {"SampleReceivedDate": "date"}],
		"Source": [{"Source": ["Human", "Food", "Animal, cattle", "Animal, poultry", "Animal, swine", "Animal, other", "Environment", "Water"]}],
		"Owner": [{"Owner": "text disabled"}],
		"Submitter": [{"Submitter": "text", "data": ""}],
		"Additional Information": [{"AdditionalInformation": "text", "maxlength":"10"}],
		"Location": [{"Location": "text disabled"}]
	}

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
		"Food-Bug": "Food-Bug",
		"Additional Info": "AdditionalInformation",
		"More Info": "More Info",
		"Analysis": "Analysis"
	}

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
		"Food-Bug":"Food-Bug",
		"AdditionalInformation":"Additional Info",
		"More Info": "More Info",
		"Analysis": "Analysis"
	}

	var minimal_headers = ["Strain Name", "Species ID", "Source", "Location", "Received Date", "Sampling Date"];

	return {
		add_owner: function(owner_info){
			fields["Submitter"][0]["data"] = owner_info;
			return owner_info;
		},
		get_fields: function(){
			return fields;
		},
		get_dict_fields: function(){
			return dict_fields;
		},
		get_dict_fields_reverse: function(){
			return dict_fields_reverse;
		},
		get_minimal_fields: function(){
			return minimal_headers;
		}
	}
}