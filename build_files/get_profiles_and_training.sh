#!/bin/bash

# Create schemas dir if dont exist
mkdir -p ${1}/schemas/

# Enter schemas directory
cd ${1}/schemas/

# Get Salmonella enterica schema
if [ ! -d "${1}/schemas/schema_Salmonella_Py3" ]; then

    echo "---> Downloading Salmonella enterica schema  ..."
    cd ${1}/schemas/
    wget https://github.com/bfrgoncalves/INNUENDO_schemas/releases/download/v1.0/Salmonella_schema.tar.gz

    echo "---> Extracting Salmonella enterica schema  ..."
    tar zxf Salmonella_schema.tar.gz
    rm -rf Salmonella_schema.tar.gz

    echo "---> Parsing bad formatted alleles  ..."
    cd ${1}/schemas/schema_Salmonella_Py3
    grep -P "[\x80-\xFF]" *.fasta | cut -f1 -d":" > bad_files.txt
    for i in `cat bad_files.txt`; do echo $i; cat ${i} | tr -d '\200-\377' > ${i}.mod; done
    for i in `ls *.mod`; do mv $i ${i%.mod}; done

    find ${1}/schemas/schema_Salmonella_Py3/*.fasta > listGenes.txt

fi

# Get Yersinia enterocolitica schema
if [ ! -d "${1}/schemas/schema_Yenterocolitica_Py3_V1.5" ]; then

    echo "---> Downloading Yersinia enterocolitica schema  ..."
    cd ${1}/schemas/
    #wget https://github.com/bfrgoncalves/INNUENDO_schemas/releases/download/v1.0/Yenterocolitica_schema.tar.gz
    wget https://github.com/bfrgoncalves/INNUENDO_schemas/releases/download/1.1/Yenterocolitica_wgMLST_6344_schema.tar.gz

    echo "---> Extracting Yersinia enterocolitica schema  ..."
    tar zxf Yenterocolitica_wgMLST_6344_schema.tar.gz
    rm -rf Yenterocolitica_wgMLST_6344_schema.tar.gz

    echo "---> Parsing bad formatted alleles  ..."
    cd ${1}/schemas/schema_Yenterocolitica_Py3_V1.5
    grep -P "[\x80-\xFF]" *.fasta | cut -f1 -d":" > bad_files.txt
    for i in `cat bad_files.txt`; do echo $i; cat ${i} | tr -d '\200-\377' > ${i}.mod; done
    for i in `ls *.mod`; do mv $i ${i%.mod}; done

    find ${1}/schemas/schema_Yenterocolitica_Py3_V1.5/*.fasta > listGenes.txt
fi

# Get Escherichia coli schema
if [ ! -d "${1}/schemas/schema_enterobase_V4_called" ]; then

    echo "---> Downloading Escherichia coli schema  ..."
    cd ${1}/schemas/
    #wget https://github.com/bfrgoncalves/INNUENDO_schemas/releases/download/v1.0/Ecoli_schema.tar.gz
    wget https://github.com/bfrgoncalves/INNUENDO_schemas/releases/download/1.1/Ecoli_wgMLST_7601_schema.tar.gz

    echo "---> Extracting Escherichia coli schema  ..."
    tar zxf Ecoli_wgMLST_7601_schema.tar.gz
    rm -rf Ecoli_wgMLST_7601_schema.tar.gz

    echo "---> Parsing bad formatted alleles  ..."
    cd ${1}/schemas/schema_enterobase_V4_called
    grep -P "[\x80-\xFF]" *.fasta | cut -f1 -d":" > bad_files.txt
    for i in `cat bad_files.txt`; do echo $i; cat ${i} | tr -d '\200-\377' > ${i}.mod; done
    for i in `ls *.mod`; do mv $i ${i%.mod}; done

    find ${1}/schemas/schema_enterobase_V4_called/*.fasta > listGenes.txt
fi

# Get Campylobacter jejuni/coli schema
if [ ! -d "${1}/schemas/schema_seed_campy_roary_V5" ]; then

    echo "---> Downloading Campylobacter jejuni schema  ..."
    cd ${1}/schemas/
    wget https://github.com/bfrgoncalves/INNUENDO_schemas/releases/download/1.1/Cjejuni_wgMLST_2795_schema.tar.gz
    #wget https://github.com/bfrgoncalves/INNUENDO_schemas/releases/download/v1.0/ccolicjejuni.tar.gz

    echo "---> Extracting Campylobacter jejuni/coli schema  ..."
    tar zxf Cjejuni_wgMLST_2795_schema.tar.gz
    rm -rf Cjejuni_wgMLST_2795_schema.tar.gz

    echo "---> Parsing bad formatted alleles  ..."
    cd ${1}/schemas/schema_seed_campy_roary_V5
    grep -P "[\x80-\xFF]" *.fasta | cut -f1 -d":" > bad_files.txt
    for i in `cat bad_files.txt`; do echo $i; cat ${i} | tr -d '\200-\377' > ${i}.mod; done
    for i in `ls *.mod`; do mv $i ${i%.mod}; done

    find ${1}/schemas/schema_seed_campy_roary_V5/*.fasta > listGenes.txt
fi

# Create prodigal_training_files dir if dont exist
mkdir -p ${1}/prodigal_training_files


count_p=$(ls ${1}/prodigal_training_files | wc -l)

# Get Prodigal training files
if [ $count_p -eq 1 ]; then

    echo "---> Downloading prodigal training file  ..."
    cd ${1}/prodigal_training_files
    git clone https://github.com/mickaelsilva/prodigal_training_files.git

fi

# Create serotyping dir if dont exist
mkdir -p ${1}/serotyping_files

count_s=$(ls ${1}/serotyping_files | wc -l)

# Get Serotyping files
if [ $count_s -eq 1 ]; then

    echo "---> Downloading serotyping files  ..."
    cd ${1}/serotyping_files
    mkdir escherichia_coli
    cd escherichia_coli
    wget https://raw.githubusercontent.com/B-UMMI/seq_typing/master/serotyping_reference_sequences/escherichia_coli/1_O_type.fasta
    wget https://raw.githubusercontent.com/B-UMMI/seq_typing/master/serotyping_reference_sequences/escherichia_coli/2_H_type.fasta

fi
