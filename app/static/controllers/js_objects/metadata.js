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
		"Strain ID": "species_id",
		"Received Date": "SampleReceivedDate",
		"Source": "source_Source",
		"File 1": "File_1",
		"File 2": "File_2",
		"Primary": "Primary",
		"Sampling Date": "SamplingDate",
		"Food-Bug": "Food-Bug",
		"Additional Info": "Additional Information",
		"Analysis": "Analysis"
	}

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
		}
	}
}