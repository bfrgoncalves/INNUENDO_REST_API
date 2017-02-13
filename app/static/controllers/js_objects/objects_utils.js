function Objects_Utils(){

	function normalTable(table_id){

	    table = $('#' + table_id).DataTable( {
	        //responsive: true,
	        colReorder: true,
	        dom: 'Bfrtip',
	        stateSave: true,
	        buttons: [
	            'colvis'
	        ],
	        deferRender:    true,
	        scrollY:        200,
	        scrollCollapse: true,
	        columnDefs: [
    			{ "width": "20%", "targets": "_all"},
	            //{"className": "dt-center", "targets": "_all"},
	            {
	                orderable: false,
	                className: 'select-checkbox',
	                targets:   0
	            }
	          ],
	        paging: false,
	        select: {
	            style:    'os',
	            selector: 'td:first-child'
	        },
	        order: [[ 1, 'asc' ]]
	    } );

	    table.columns.adjust().draw();

	}

	function nestedTable(table_id){

	    table = $('#' + table_id).DataTable( {
	    	/*
	        //responsive: true,
	        colReorder: true,
	        dom: 'Bfrtip',
	        stateSave: true,
	        buttons: [
	            'colvis'
	        ],
	        deferRender:    true,
	        scrollY:        200,
	        //scrollCollapse: true,
	        */
	        columnDefs: [
	        	{ "width": "20%", "targets": "_all"},
	            //{"className": "dt-center", "targets": "_all"},
	            {
	                orderable: false,
	                className: 'select-checkbox',
	                targets:   0
	            }
	          ],
	        paging: true,
	        select: {
	            style:    'multi',
	            selector: 'td:first-child'
	        },
	        order: [[ 1, 'asc' ]],
	        scrollX:true
	    } );
	    table.columns.adjust().draw();


	}

	return {

		apply_pipeline_to_strain: function(strain_table_id, strain_name, workflow_ids, pipelinesByID, pipelines_applied){

	        var table = $('#' + strain_table_id).DataTable();
	    
	        var selected_indexes = $.map(table.rows().indexes(), function(index){
	            return index;
	        });

	        var strain_names = $.map(table.rows().data(), function(item){
	            return item[1];
	        });
	        var count = 0;
	        for(w in workflow_ids){
	        	count+=1;
	            workflow_id = workflow_ids[w];

	            for(i in selected_indexes){
	                var toAdd = '';
	                if(strain_names[i] == strain_name){
	                	buttonselectedPipeline = '<button class="btn btn-sm btn-default" id="'+strain_name.replace(/ /g, '_')+"_"+String(count)+'">'+ pipelinesByID[workflow_id] + '</button>';
	                    if(!pipelines_applied.hasOwnProperty(strain_name)){
	                        pipelines_applied[strain_name] = [];
	                    }
	                    if(pipelines_applied[strain_name].indexOf(buttonselectedPipeline) < 0) pipelines_applied[strain_name].push(buttonselectedPipeline);
	                    
	                    for(j in pipelines_applied[strain_name]){
	                        toAdd += pipelines_applied[strain_name][j];
	                    }
	                    table.cell(selected_indexes[i], -1).data(toAdd);
	                }
	            
	            }
	        }
	        table.draw();
	    },
	    show_message: function(element, type, message){

		    $('.alert').remove();
		    $('#' + element).empty();
		    $('#' + element).append('<div class="alert alert-'+type+'"><a class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>'+type+'!</strong> '+message+'</div>')

		},
		destroyTable: function(table_id){
		    if ( $.fn.DataTable.isDataTable( '#' + table_id ) ) {
		      $('#' + table_id).DataTable().destroy();
		    }
		},
		loadDataTables: function(table_id, table_values){

		    setTimeout(function(){

		        if ( $.fn.DataTable.isDataTable( '#' + table_id ) ) {
		          return false;
		        }

		        if (table_values.length == 0) return false;

		        var arrayOfHeaders = Object.keys(table_values[0]);

		        if (arrayOfHeaders.length == 0) return false;

		        //if (table_id == 'strains_table' || table_id == 'public_strains_table'){
				nestedTable(table_id);
		        //}
		        //else normalTable(table_id);

		    }, 150);
		}
	}
}