function Metadata(){

	var metadata_object = {};
	var data_owner = "";

	var fields = {

		"StrainID": [ {"Primary": "text"}, {"Food-Bug": "text"}],
		"Date": [{"SamplingDate": "date"}, {"SampleReceivedDate": "date"}],
		"Source": [{"Source": ["Human", "Food", "Animal, cattle", "Animal, poultry", "Animal, swine", "Animal, other", "Environment", "Water"]}],
		"Owner": [{"Owner": "text disabled"}],
		"Submitter": [{"Submitter": "text", "data": ""}],
		"AdditionalInformation": [{"AdditionalInformation": "text", "maxlength":"10"}],
		"Location": [{"Location": "text disabled"}]
	}

	return {
		add_owner: function(owner_info){
			fields["Submitter"][0]["data"] = owner_info;
			return owner_info;
		},
		get_fields: function(){
			return fields;
		}
	}
}